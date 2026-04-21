-- ============================================================
-- [E4 / APEX-SEC] Audit trail jurídico — append-only.
-- ============================================================
-- Trilha imutável de eventos sensíveis (auth, criação de processo,
-- validação documental, geração de dossiê, confirmação de pagamento).
--
-- LGPD art. 37 (registro das operações de tratamento) + defesa em
-- caso de disputa (consultoria de crédito → quem fez o quê e quando).
--
-- Insert é exclusividade do service-role (lib/audit.ts via admin
-- client). Sem UPDATE / DELETE / INSERT para anon/authenticated:
-- a ausência de policy nessas operações já bloqueia por padrão sob
-- RLS habilitada.
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_events (
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
  ON audit_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_created
  ON audit_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target
  ON audit_events(target_id) WHERE target_id IS NOT NULL;

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Usuário lê só os próprios eventos (futura tela "minha atividade").
DROP POLICY IF EXISTS "audit_self_read" ON audit_events;
CREATE POLICY "audit_self_read" ON audit_events
  FOR SELECT USING (user_id = auth.uid());

-- Sem policy de INSERT/UPDATE/DELETE para anon/authenticated → bloqueado
-- por padrão. Insert sempre via service-role no helper lib/audit.ts.

COMMENT ON TABLE audit_events IS
  'Trilha append-only de eventos sensíveis (E4/APEX-SEC). Insert restrito ao service-role.';
