-- ============================================================
-- AgroBridge — RPC `confirmar_pagamento_v2` com registro em `compras`
-- ============================================================
-- Evolução da v2 (20260421010000) que também grava em `public.compras`
-- e aplica o limite mensal global de 6 Mentorias/mês.
--
-- Contrato de retorno mantido — a aplicação não precisa mudar.
--
-- Mudanças:
--   (1) Adiciona INSERT em `compras` atomicamente (ON CONFLICT DO NOTHING
--       por (provider, provider_transaction_id)).
--   (2) Para tier='mentoria': antes do CAS em processos, verifica se
--       já foram vendidas 6+ mentorias pagas neste mês. Se sim, grava
--       compras.status='failed' com metadata.reason='mes_esgotado' e
--       retorna motivo='mentoria_mes_esgotado' sem liberar acesso.
--   (3) `amount_cents` obtido do parâmetro `p_amount_cents` (novo).
-- ============================================================

-- A v2 anterior tinha 6 parâmetros. Adicionamos 2 — signature muda,
-- CREATE OR REPLACE não substitui; precisamos DROP primeiro.
DROP FUNCTION IF EXISTS public.confirmar_pagamento_v2(UUID, TEXT, TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.confirmar_pagamento_v2(
  p_processo_id    UUID,
  p_event_id       TEXT,
  p_evento         TEXT,
  p_provider       TEXT,
  p_tier           TEXT,
  p_raw            JSONB,
  p_amount_cents   INTEGER      DEFAULT NULL,
  p_product_id     TEXT         DEFAULT NULL
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
  v_inserido        UUID;
  v_proc            RECORD;
  v_fase_nova       TEXT;
  v_email           TEXT;
  v_vagas_usadas    INTEGER;
  v_tx_id           TEXT;
  v_compra_existia  BOOLEAN;
BEGIN
  IF p_tier IS NOT NULL AND p_tier NOT IN ('diagnostico', 'dossie', 'mentoria') THEN
    RETURN QUERY SELECT
      FALSE, 'tier_invalido'::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Camada 1: dedup por (provider, event_id) em webhook_events
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

  -- Gate de limite mensal para Mentoria. Conta linhas já pagas neste mês
  -- com lock implícito via COUNT em transação — corrida extrema (2 webhooks
  -- simultâneos na vaga #6) pode dar overflow de 1, aceita (Paulo estorna
  -- manualmente e Cakto é idempotente).
  IF p_tier = 'mentoria' THEN
    SELECT COUNT(*)::INTEGER
      INTO v_vagas_usadas
    FROM public.compras
    WHERE tier = 'mentoria'
      AND status = 'paid'
      AND paid_at >= date_trunc('month', NOW())
      AND paid_at <  date_trunc('month', NOW()) + interval '1 month'
      AND deleted_at IS NULL;

    IF v_vagas_usadas >= 6 THEN
      v_tx_id := COALESCE(p_raw -> 'data' ->> 'id', p_event_id);
      INSERT INTO public.compras (
        user_id, processo_id, provider, provider_transaction_id,
        provider_product_id, tier, status, amount_cents, metadata
      ) VALUES (
        v_proc.user_id, p_processo_id, COALESCE(p_provider, 'cakto'),
        v_tx_id, p_product_id, 'mentoria', 'failed',
        COALESCE(p_amount_cents, 0),
        jsonb_build_object(
          'reason',        'mes_esgotado',
          'event_id',      p_event_id,
          'vagas_usadas',  v_vagas_usadas
        )
      )
      ON CONFLICT (provider, provider_transaction_id) DO NOTHING;

      RETURN QUERY SELECT
        FALSE, 'mentoria_mes_esgotado'::TEXT,
        v_proc.fase, v_proc.fase, v_proc.user_id, v_email, 'mentoria'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Camada 2: CAS atômico em processos (inalterado da v2)
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
    -- Outro evento já confirmou — retorna tier atual do processo
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

  -- Registra em compras (idempotente via UNIQUE (provider, provider_transaction_id))
  v_tx_id := COALESCE(p_raw -> 'data' ->> 'id', p_event_id);
  INSERT INTO public.compras (
    user_id, processo_id, provider, provider_transaction_id,
    provider_product_id, tier, status, amount_cents, paid_at, metadata
  ) VALUES (
    v_proc.user_id, p_processo_id, COALESCE(p_provider, 'cakto'),
    v_tx_id, p_product_id, COALESCE(p_tier, 'dossie'), 'paid',
    COALESCE(p_amount_cents, 0), NOW(),
    jsonb_build_object('event_id', p_event_id, 'evento', p_evento)
  )
  ON CONFLICT (provider, provider_transaction_id) DO NOTHING
  RETURNING TRUE INTO v_compra_existia;

  RETURN QUERY SELECT
    TRUE, 'ok'::TEXT,
    v_proc.fase, v_fase_nova, v_proc.user_id, v_email,
    COALESCE(p_tier, 'dossie')::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.confirmar_pagamento_v2(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirmar_pagamento_v2(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, INTEGER, TEXT) TO service_role;
