-- ============================================================
-- AgroBridge — RPC `confirmar_pagamento` (Eixo 1 · A1)
-- Idempotência atômica em duas camadas:
--   (1) INSERT ... ON CONFLICT (provider, event_id) DO NOTHING
--       → retries do MESMO event_id viram no-op imediato.
--   (2) CAS em processos.pagamento_confirmado=FALSE
--       → eventos distintos para o mesmo processo (charge.paid +
--         order.paid) elegem apenas UM vencedor; a transição
--         'pagamento' → 'coleta' ocorre com esse UPDATE único.
--
-- SECURITY DEFINER porque precisa escrever em `webhook_events`
-- (deny-by-default) e ler auth.users. Execute revogado de PUBLIC.
-- ============================================================

CREATE OR REPLACE FUNCTION public.confirmar_pagamento(
  p_processo_id UUID,
  p_event_id    TEXT,
  p_evento      TEXT,
  p_raw         JSONB
)
RETURNS TABLE (
  first_time   BOOLEAN,
  motivo       TEXT,
  fase_antes   TEXT,
  fase_depois  TEXT,
  user_id      UUID,
  email        TEXT
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
  -- Camada 1: dedup por event_id
  INSERT INTO public.webhook_events(provider, event_id, payload)
    VALUES ('pagarme', p_event_id, p_raw)
    ON CONFLICT (provider, event_id) DO NOTHING
    RETURNING id INTO v_inserido;

  IF v_inserido IS NULL THEN
    RETURN QUERY SELECT
      FALSE, 'event_replay'::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  -- Snapshot do processo antes da tentativa
  SELECT id, user_id, fase, pagamento_confirmado
    INTO v_proc
  FROM public.processos
  WHERE id = p_processo_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE, 'processo_not_found'::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = v_proc.user_id;

  -- Camada 2: CAS atômico
  UPDATE public.processos
  SET
    pagamento_confirmado = TRUE,
    fase = CASE WHEN fase = 'pagamento' THEN 'coleta' ELSE fase END,
    perfil_json = jsonb_set(
      COALESCE(perfil_json, '{}'::jsonb),
      '{_pagamento}',
      COALESCE(perfil_json -> '_pagamento', '{}'::jsonb)
        || jsonb_build_object(
          'status',   'paid',
          'pago_em',  to_jsonb(NOW()),
          'evento',   p_evento,
          'event_id', p_event_id
        ),
      TRUE
    )
  WHERE id = p_processo_id
    AND pagamento_confirmado = FALSE
  RETURNING fase INTO v_fase_nova;

  IF v_fase_nova IS NULL THEN
    -- outro evento chegou antes e já confirmou
    RETURN QUERY SELECT
      FALSE, 'already_confirmed'::TEXT,
      v_proc.fase, v_proc.fase, v_proc.user_id, v_email;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    TRUE, 'ok'::TEXT,
    v_proc.fase, v_fase_nova, v_proc.user_id, v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.confirmar_pagamento(UUID, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirmar_pagamento(UUID, TEXT, TEXT, JSONB) TO service_role;
