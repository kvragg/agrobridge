-- ============================================================
-- AgroBridge — Fluxo Completo (qualificação → pagamento → coleta → checklist → dossiê)
-- Migration ADITIVA — preserva schema/RLS existentes.
-- ============================================================

-- ----------------------------------------------------------------
-- processos: novos campos para o fluxo em 5 fases
-- ----------------------------------------------------------------
ALTER TABLE processos
  ADD COLUMN IF NOT EXISTS fase TEXT NOT NULL DEFAULT 'qualificacao'
    CHECK (fase IN ('qualificacao','pagamento','coleta','checklist','concluido')),
  ADD COLUMN IF NOT EXISTS pagamento_confirmado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dados_qualificacao JSONB,
  ADD COLUMN IF NOT EXISTS dados_completos JSONB,
  ADD COLUMN IF NOT EXISTS historico_qualificacao JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS historico_completo JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS atividade TEXT,
  ADD COLUMN IF NOT EXISTS municipio TEXT,
  ADD COLUMN IF NOT EXISTS valor_solicitado NUMERIC(14,2);

CREATE INDEX IF NOT EXISTS idx_processos_fase ON processos(fase);

-- ----------------------------------------------------------------
-- checklist_docs: tabela nova, checklist progressivo em 3 grupos
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklist_docs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id   UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL,
  nome          TEXT NOT NULL,
  grupo         SMALLINT NOT NULL CHECK (grupo IN (1,2,3)),
  obrigatorio   BOOLEAN NOT NULL DEFAULT TRUE,
  storage_path  TEXT,
  status        TEXT NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente','enviado')),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (processo_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_checklist_docs_processo ON checklist_docs(processo_id);
CREATE INDEX IF NOT EXISTS idx_checklist_docs_grupo    ON checklist_docs(processo_id, grupo);

-- Trigger para manter updated_at
DROP TRIGGER IF EXISTS checklist_docs_updated_at ON checklist_docs;
CREATE TRIGGER checklist_docs_updated_at
  BEFORE UPDATE ON checklist_docs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: só o dono do processo vê/edita
ALTER TABLE checklist_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checklist_docs_owner" ON checklist_docs;
CREATE POLICY "checklist_docs_owner" ON checklist_docs
  FOR ALL USING (
    processo_id IN (
      SELECT id FROM processos WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    processo_id IN (
      SELECT id FROM processos WHERE user_id = auth.uid()
    )
  );
