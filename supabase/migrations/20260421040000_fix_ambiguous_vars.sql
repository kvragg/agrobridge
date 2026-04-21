-- ============================================================
-- AgroBridge — Fix ambiguous column reference em confirmar_pagamento_v2
-- ============================================================
-- O RETURNS TABLE(..., user_id UUID, email TEXT, tier TEXT) cria OUT
-- parameters visíveis como variáveis PL/pgSQL no corpo da função. O
-- SELECT bare `user_id` colidia com o OUT param, provocando ERROR 42702
-- ("column reference is ambiguous") na primeira chamada da RPC.
--
-- Correção cirúrgica: qualificar o SELECT com alias de tabela `p.`.
-- Sem mudar a assinatura (o consumidor TS lê row.user_id).
-- Auditadas também as 3 RPCs de lock de dossiê (iniciar/finalizar/
-- abortar) — OUT columns escolhidas com sufixo semântico, sem colisão.
-- Migrations antigas (20260421010000, 20260421030000) ficam intactas
-- como histórico imutável; esta CREATE OR REPLACE sobrescreve o corpo.
-- ============================================================

CREATE OR REPLACE FUNCTION public.confirmar_pagamento_v2(
  p_processo_id UUID,
  p_event_id    TEXT,
  p_evento      TEXT,
  p_provider    TEXT,
  p_tier        TEXT,
  p_raw         JSONB
)
RETURNS TABLE (
  first_time   BOOLEAN,
  motivo       TEXT,
  fase_antes   TEXT,
  fase_depois  TEXT,
  user_id      UUID,
  email        TEXT,
  tier         TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserido   UUID;
  v_proc       RECORD;
  v_fase_nova  TEXT;
  v_email      TEXT;
BEGIN
  IF p_tier IS NOT NULL AND p_tier NOT IN ('diagnostico', 'dossie', 'mentoria') THEN
    RETURN QUERY SELECT
      FALSE, 'tier_invalido'::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  INSERT INTO public.webhook_events(provider, event_id, payload)
    VALUES (COALESCE(p_provider, 'cakto'), p_event_id, p_raw)
    ON CONFLICT (provider, event_id) DO NOTHING
    RETURNING id INTO v_inserido;

  IF v_inserido IS NULL THEN
    RETURN QUERY SELECT
      FALSE, 'event_replay'::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Alias `p.` evita ambiguidade com OUT params (user_id, email) do RETURNS TABLE
  SELECT p.id, p.user_id, p.fase, p.pagamento_confirmado
    INTO v_proc
  FROM public.processos p
  WHERE p.id = p_processo_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE, 'processo_not_found'::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = v_proc.user_id;

  UPDATE public.processos
  SET
    pagamento_confirmado = TRUE,
    fase = CASE WHEN fase = 'pagamento' THEN 'coleta' ELSE fase END,
    perfil_json = jsonb_set(
      jsonb_set(
        COALESCE(perfil_json, '{}'::jsonb),
        '{_tier}',
        to_jsonb(COALESCE(p_tier, 'dossie')),
        TRUE
      ),
      '{_pagamento}',
      COALESCE(perfil_json -> '_pagamento', '{}'::jsonb)
        || jsonb_build_object(
          'status',   'paid',
          'pago_em',  to_jsonb(NOW()),
          'evento',   p_evento,
          'event_id', p_event_id,
          'provider', COALESCE(p_provider, 'cakto'),
          'tier',     COALESCE(p_tier, 'dossie')
        ),
      TRUE
    )
  WHERE id = p_processo_id
    AND pagamento_confirmado = FALSE
  RETURNING fase INTO v_fase_nova;

  IF v_fase_nova IS NULL THEN
    DECLARE
      v_tier_atual TEXT;
    BEGIN
      SELECT p.perfil_json ->> '_tier' INTO v_tier_atual
      FROM public.processos p
      WHERE p.id = p_processo_id;

      RETURN QUERY SELECT
        FALSE, 'already_confirmed'::TEXT,
        v_proc.fase, v_proc.fase, v_proc.user_id, v_email, v_tier_atual;
      RETURN;
    END;
  END IF;

  RETURN QUERY SELECT
    TRUE, 'ok'::TEXT,
    v_proc.fase, v_fase_nova, v_proc.user_id, v_email,
    COALESCE(p_tier, 'dossie')::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.confirmar_pagamento_v2(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirmar_pagamento_v2(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;
