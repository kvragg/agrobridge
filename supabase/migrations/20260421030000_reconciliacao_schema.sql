-- ============================================================
-- AgroBridge — Reconciliação de schema (2026-04-20)
-- ============================================================
-- O painel Supabase mostrava "No migrations": tudo entre a initial
-- (20240101) e hoje existia no repo mas nunca foi aplicado. Esta
-- migration fecha o gap, restrita ao mínimo necessário para destravar
-- o webhook Cakto (`confirmar_pagamento_v2`) e a trilha LGPD
-- (`lib/audit.ts`). Idempotente: pode rodar 2x sem efeito colateral.
-- ============================================================

-- ------------------------------------------------------------
-- 1) webhook_events — dedup forte (provider, event_id).
--     RLS ligada sem policy: service_role bypassa; anon/auth = deny.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     TEXT NOT NULL,
  event_id     TEXT NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload      JSONB NOT NULL,
  UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received
  ON public.webhook_events (received_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 2) audit_events — trilha append-only LGPD art. 37.
--     Insert só via service_role (lib/audit.ts). Usuário lê só
--     os próprios eventos. INSERT/UPDATE/DELETE sem policy =
--     bloqueado por padrão sob RLS.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,
  target_id   TEXT,
  ip          INET,
  user_agent  TEXT,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_created
  ON public.audit_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_created
  ON public.audit_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target
  ON public.audit_events (target_id) WHERE target_id IS NOT NULL;

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_self_read" ON public.audit_events;
CREATE POLICY "audit_self_read" ON public.audit_events
  FOR SELECT USING (user_id = auth.uid());

COMMENT ON TABLE public.audit_events IS
  'Trilha append-only de eventos sensíveis (E4/APEX-SEC). Insert restrito ao service-role.';

-- ------------------------------------------------------------
-- 3) processos.pagamento_confirmado — CAS do webhook Cakto.
--     Linhas antigas nascem FALSE (estado correto, ninguém pagou
--     Cakto ainda — pagamentos manuais ficam registrados só em
--     `status = 'concluido'`, tratado no passo 5).
-- ------------------------------------------------------------
ALTER TABLE public.processos
  ADD COLUMN IF NOT EXISTS pagamento_confirmado BOOLEAN NOT NULL DEFAULT FALSE;

-- ------------------------------------------------------------
-- 4) processos.fase — máquina de estados do fluxo Cakto.
--     Adiciona coluna + CHECK separadamente para idempotência real
--     (ADD COLUMN IF NOT EXISTS ignora inline constraints se a
--     coluna já existir sem CHECK — defesa via DO-block).
-- ------------------------------------------------------------
ALTER TABLE public.processos
  ADD COLUMN IF NOT EXISTS fase TEXT NOT NULL DEFAULT 'qualificacao';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'processos_fase_check'
      AND conrelid = 'public.processos'::regclass
  ) THEN
    ALTER TABLE public.processos
      ADD CONSTRAINT processos_fase_check
      CHECK (fase IN ('qualificacao','pagamento','coleta','checklist','concluido'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_processos_fase
  ON public.processos (fase);

-- ------------------------------------------------------------
-- 5) Backfill _tier='dossie' em processos pré-funil que já foram
--     concluídos (dossiê gerado = pagamento aconteceu).
--     Critério seguro sem depender de pagamento_confirmado (que
--     nasce FALSE). Só escreve se _tier ainda não existir.
-- ------------------------------------------------------------
UPDATE public.processos
SET perfil_json = jsonb_set(
  COALESCE(perfil_json, '{}'::jsonb),
  '{_tier}',
  to_jsonb('dossie'::text),
  TRUE
)
WHERE status = 'concluido'
  AND (perfil_json IS NULL OR perfil_json -> '_tier' IS NULL);

-- ------------------------------------------------------------
-- 6) confirmar_pagamento_v2 — CREATE OR REPLACE após o schema
--     existir. Corpo idêntico ao arquivo 20260421010000; re-executar
--     garante consistência mesmo que a função tenha sido criada
--     antes das colunas (Postgres só valida nomes em runtime).
-- ------------------------------------------------------------
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
