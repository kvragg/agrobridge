-- ============================================================================
-- Pilar #1 — Wave 2: RPC transicionar_dossie_entrega
-- ----------------------------------------------------------------------------
-- Única porta de mutação da tabela dossie_entregas.
-- RLS bloqueia INSERT/UPDATE direto; só esta RPC SECURITY DEFINER pode escrever.
-- Isso força o state machine a passar pela validação de transição.
--
-- Transições válidas:
--   (vazio)     → em_fila            (cria registro)
--   nao_iniciado→ em_fila
--   em_fila     → gerando
--   gerando     → pronto
--   gerando     → erro
--   erro        → em_fila            (retry)
--   pronto      → em_fila            (regenerate, ex. tier upgrade)
--
-- Autorização:
--   - service_role (auth.uid() IS NULL): permitido (rota servidor)
--   - user autenticado: auth.uid() deve == processos.user_id
--   - qualquer outro: EXCEPTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.transicionar_dossie_entrega(
  p_processo_id        UUID,
  p_novo_status        TEXT,
  p_tier_snapshot      TEXT        DEFAULT NULL,
  p_pdf_url            TEXT        DEFAULT NULL,
  p_pdf_url_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_error_message      TEXT        DEFAULT NULL
)
RETURNS public.dossie_entregas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_processo_user_id UUID;
  v_caller_uid       UUID := auth.uid();
  v_existente        public.dossie_entregas;
  v_resultado        public.dossie_entregas;
  v_now              TIMESTAMPTZ := NOW();
BEGIN
  -- 0) Sanity: status novo deve ser válido
  IF p_novo_status NOT IN ('nao_iniciado','em_fila','gerando','pronto','erro') THEN
    RAISE EXCEPTION 'status_invalido: %', p_novo_status
      USING ERRCODE = '22023';
  END IF;

  -- 1) Carrega processo e valida autorização
  SELECT pr.user_id INTO v_processo_user_id
  FROM public.processos pr
  WHERE pr.id = p_processo_id
    AND pr.deleted_at IS NULL;

  IF v_processo_user_id IS NULL THEN
    RAISE EXCEPTION 'processo_nao_encontrado'
      USING ERRCODE = '02000';
  END IF;

  -- service_role tem auth.uid() = NULL e bypass autorizado.
  -- user autenticado precisa ser dono do processo.
  IF v_caller_uid IS NOT NULL AND v_caller_uid <> v_processo_user_id THEN
    RAISE EXCEPTION 'nao_autorizado'
      USING ERRCODE = '42501';
  END IF;

  -- 2) Lê estado existente (se houver)
  SELECT de.* INTO v_existente
  FROM public.dossie_entregas de
  WHERE de.processo_id = p_processo_id
    AND de.deleted_at IS NULL
  FOR UPDATE;

  -- 3) Caso A: não existe → INSERT inicial (só permitido se novo status = em_fila)
  IF v_existente.id IS NULL THEN
    IF p_novo_status <> 'em_fila' THEN
      RAISE EXCEPTION 'transicao_invalida: registro_inexistente -> %', p_novo_status
        USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.dossie_entregas (
      processo_id,
      user_id,
      status,
      tier_snapshot,
      enqueued_at,
      attempt_count
    )
    VALUES (
      p_processo_id,
      v_processo_user_id,
      'em_fila',
      p_tier_snapshot,
      v_now,
      0
    )
    RETURNING * INTO v_resultado;

    RETURN v_resultado;
  END IF;

  -- 4) Caso B: existe → valida transição
  -- Idempotência: mesmo status não é erro, mas também não atualiza timestamps
  IF v_existente.status = p_novo_status THEN
    RETURN v_existente;
  END IF;

  IF NOT (
    (v_existente.status = 'nao_iniciado' AND p_novo_status = 'em_fila') OR
    (v_existente.status = 'em_fila'      AND p_novo_status = 'gerando') OR
    (v_existente.status = 'gerando'      AND p_novo_status IN ('pronto','erro')) OR
    (v_existente.status = 'erro'         AND p_novo_status = 'em_fila') OR
    (v_existente.status = 'pronto'       AND p_novo_status = 'em_fila')
  ) THEN
    RAISE EXCEPTION 'transicao_invalida: % -> %', v_existente.status, p_novo_status
      USING ERRCODE = '22023';
  END IF;

  -- 5) Aplica transição (atualiza só o que faz sentido pro novo estado)
  UPDATE public.dossie_entregas de
  SET
    status        = p_novo_status,
    tier_snapshot = COALESCE(p_tier_snapshot, de.tier_snapshot),
    enqueued_at   = CASE WHEN p_novo_status = 'em_fila' THEN v_now ELSE de.enqueued_at END,
    generating_at = CASE WHEN p_novo_status = 'gerando' THEN v_now ELSE de.generating_at END,
    ready_at      = CASE WHEN p_novo_status = 'pronto'  THEN v_now ELSE de.ready_at END,
    errored_at    = CASE WHEN p_novo_status = 'erro'    THEN v_now ELSE de.errored_at END,
    pdf_url            = CASE WHEN p_novo_status = 'pronto' THEN p_pdf_url            ELSE de.pdf_url END,
    pdf_url_expires_at = CASE WHEN p_novo_status = 'pronto' THEN p_pdf_url_expires_at ELSE de.pdf_url_expires_at END,
    error_message = CASE
                      WHEN p_novo_status = 'erro'    THEN p_error_message
                      WHEN p_novo_status = 'em_fila' THEN NULL
                      ELSE de.error_message
                    END,
    attempt_count = CASE WHEN p_novo_status = 'gerando' THEN de.attempt_count + 1 ELSE de.attempt_count END
  WHERE de.id = v_existente.id
  RETURNING * INTO v_resultado;

  RETURN v_resultado;
END;
$$;

COMMENT ON FUNCTION public.transicionar_dossie_entrega IS
  'Unica porta de mutacao de dossie_entregas. Valida state machine e autorizacao.';

-- Permissões: authenticated + service_role
REVOKE ALL ON FUNCTION public.transicionar_dossie_entrega(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transicionar_dossie_entrega(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO authenticated, service_role;
