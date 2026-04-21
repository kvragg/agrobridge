-- ============================================================
-- AgroBridge — Lock atômico de geração de dossiê (Eixo 1 · A2)
-- Fecha o vetor de DoS econômico (10 cliques → 10 chamadas Sonnet).
-- A lógica fica em RPCs SECURITY INVOKER: o RLS `processos_owner`
-- já confina as mutações ao dono da sessão, então não há ampliação
-- de privilégio. O lock é um CAS em `dossie_gerando_desde`.
-- ============================================================

ALTER TABLE public.processos
  ADD COLUMN IF NOT EXISTS dossie_gerando_desde TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_processos_dossie_em_geracao
  ON public.processos (id)
  WHERE dossie_gerando_desde IS NOT NULL;

-- ------------------------------------------------------------
-- iniciar_geracao_dossie: CAS. Adquire se NULL ou stale (>3 min).
-- Retorna `acquired=true` APENAS para a thread vencedora.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.iniciar_geracao_dossie(
  p_processo_id UUID
)
RETURNS TABLE (
  acquired BOOLEAN,
  motivo   TEXT
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  UPDATE public.processos
  SET dossie_gerando_desde = NOW()
  WHERE id = p_processo_id
    AND (
      dossie_gerando_desde IS NULL
      OR dossie_gerando_desde < NOW() - INTERVAL '3 minutes'
    )
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'em_geracao'::TEXT;
  ELSE
    RETURN QUERY SELECT TRUE, 'acquired'::TEXT;
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- finalizar_geracao_dossie: persiste laudo, zera lock, retorna
-- `was_first_generation` para o caller decidir envio de email.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalizar_geracao_dossie(
  p_processo_id UUID,
  p_laudo_md    TEXT
)
RETURNS TABLE (
  was_first_generation BOOLEAN,
  gerado_em            TIMESTAMPTZ
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_gerado_antes TEXT;
  v_now          TIMESTAMPTZ := NOW();
BEGIN
  SELECT perfil_json ->> '_dossie_gerado_em'
    INTO v_gerado_antes
  FROM public.processos
  WHERE id = p_processo_id;

  UPDATE public.processos
  SET
    status = 'concluido',
    dossie_gerando_desde = NULL,
    perfil_json = jsonb_set(
      jsonb_set(
        COALESCE(perfil_json, '{}'::jsonb),
        '{_laudo_md}',
        to_jsonb(p_laudo_md),
        TRUE
      ),
      '{_dossie_gerado_em}',
      to_jsonb(v_now),
      TRUE
    )
  WHERE id = p_processo_id;

  RETURN QUERY SELECT (v_gerado_antes IS NULL), v_now;
END;
$$;

-- ------------------------------------------------------------
-- abortar_geracao_dossie: libera o lock em caso de erro no handler.
-- Sem persistir laudo. Idempotente.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.abortar_geracao_dossie(
  p_processo_id UUID
)
RETURNS VOID
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.processos
  SET dossie_gerando_desde = NULL
  WHERE id = p_processo_id;
$$;

GRANT EXECUTE ON FUNCTION public.iniciar_geracao_dossie(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalizar_geracao_dossie(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.abortar_geracao_dossie(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.iniciar_geracao_dossie(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalizar_geracao_dossie(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.abortar_geracao_dossie(UUID) FROM PUBLIC;
