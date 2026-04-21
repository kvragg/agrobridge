-- ============================================================
-- AgroBridge — RPC `confirmar_pagamento` v2 (Cakto + Tier)
-- ============================================================
-- Substitui a versão Pagar.me-only por uma que:
--   1) Aceita `p_provider` (cakto | pagarme) — idempotência continua
--      sendo (provider, event_id) UNIQUE em webhook_events.
--   2) Aceita `p_tier` (diagnostico | dossie | mentoria) — grava em
--      perfil_json._tier para o gate de tier nas APIs.
--
-- A versão antiga (sem p_provider/p_tier) continua existindo para
-- compatibilidade enquanto a transição é feita; o webhook novo
-- chama esta v2 diretamente.
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
  -- Validação de tier (defesa)
  IF p_tier IS NOT NULL AND p_tier NOT IN ('diagnostico', 'dossie', 'mentoria') THEN
    RETURN QUERY SELECT
      FALSE, 'tier_invalido'::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Camada 1: dedup por (provider, event_id)
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

  -- Snapshot do processo
  SELECT id, user_id, fase, pagamento_confirmado
    INTO v_proc
  FROM public.processos
  WHERE id = p_processo_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE, 'processo_not_found'::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = v_proc.user_id;

  -- Camada 2: CAS atômico — só o primeiro evento confirma e seta o tier.
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
    -- Outro evento já confirmou. Retorna tier atual sem alterar.
    DECLARE
      v_tier_atual TEXT;
    BEGIN
      SELECT perfil_json ->> '_tier' INTO v_tier_atual
      FROM public.processos
      WHERE id = p_processo_id;

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
