-- ============================================================
-- AgroBridge — tabela `webhook_events` (Eixo 1 · A1)
-- Deduplicação forte de retries de webhook por (provider, event_id).
-- Apenas service_role grava/lê (sem policy = deny-by-default com RLS on).
-- Serve como trilha de auditoria imutável dos eventos recebidos.
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     TEXT NOT NULL,
  event_id     TEXT NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload      JSONB NOT NULL,
  UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received
  ON webhook_events(received_at DESC);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- Sem policy por design: service_role bypassa RLS; usuários finais nunca leem.
