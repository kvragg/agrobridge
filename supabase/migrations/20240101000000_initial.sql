-- ============================================================
-- AgroBridge — Schema inicial
-- ============================================================

-- ----------------------------------------------------------------
-- Tabelas
-- ----------------------------------------------------------------

-- Processos de crédito (um por pedido do produtor)
CREATE TABLE processos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'entrevista'
                CHECK (status IN ('entrevista','checklist','documentos','concluido')),
  perfil_json JSONB,            -- JSON de saída da entrevista (Haiku)
  banco       TEXT,
  valor       NUMERIC(12,2),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mensagens do chat da entrevista
CREATE TABLE mensagens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Itens do checklist gerado pelo Sonnet
CREATE TABLE checklist_itens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id     UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  bloco           TEXT NOT NULL,
  documento_id    TEXT NOT NULL,
  nome            TEXT NOT NULL,
  urgencia        TEXT NOT NULL CHECK (urgencia IN ('BLOQUEADOR','ALTA','NORMAL','NA_HORA')),
  status          TEXT NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente','em_andamento','enviado','aprovado')),
  dados_json      JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Uploads de documentos (ligados ao item do checklist)
CREATE TABLE uploads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item_id UUID NOT NULL REFERENCES checklist_itens(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id),
  storage_path      TEXT NOT NULL,
  nome_arquivo      TEXT NOT NULL,
  mime_type         TEXT NOT NULL,
  tamanho_bytes     BIGINT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- Trigger: atualizar updated_at em processos
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER processos_updated_at
  BEFORE UPDATE ON processos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------
-- Índices
-- ----------------------------------------------------------------
CREATE INDEX idx_processos_user_id    ON processos(user_id);
CREATE INDEX idx_mensagens_processo   ON mensagens(processo_id);
CREATE INDEX idx_checklist_processo   ON checklist_itens(processo_id);
CREATE INDEX idx_uploads_checklist    ON uploads(checklist_item_id);

-- ----------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------
ALTER TABLE processos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads         ENABLE ROW LEVEL SECURITY;

-- processos: só o dono vê e edita
CREATE POLICY "processos_owner" ON processos
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- mensagens: via processo do dono
CREATE POLICY "mensagens_owner" ON mensagens
  FOR ALL USING (
    processo_id IN (
      SELECT id FROM processos WHERE user_id = auth.uid()
    )
  );

-- checklist_itens: via processo do dono
CREATE POLICY "checklist_owner" ON checklist_itens
  FOR ALL USING (
    processo_id IN (
      SELECT id FROM processos WHERE user_id = auth.uid()
    )
  );

-- uploads: só o dono
CREATE POLICY "uploads_owner" ON uploads
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------
-- Storage — bucket privado para documentos
-- ----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Só o dono pode fazer upload
CREATE POLICY "upload_owner" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Só o dono pode fazer download
CREATE POLICY "download_owner" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Só o dono pode deletar
CREATE POLICY "delete_owner" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
