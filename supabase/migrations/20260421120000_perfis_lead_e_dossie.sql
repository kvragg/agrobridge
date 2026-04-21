-- ============================================================
-- Onda 2 — Novo modelo conceitual do produto
-- ============================================================
-- Muda o modelo: cada lead tem UMA entrevista viva com memória
-- persistente. Processos vira legado (conservado intacto).
--
-- Adiciona:
--   - perfis_lead: perfil estável e acumulativo (1:1 com auth.users)
--   - trigger signup -> auto-cria perfil_lead
--   - mensagens.user_id (para entrevista única sem processo)
--   - processo_id passa a ser opcional em mensagens
-- ============================================================

-- ---------- perfis_lead ----------
CREATE TABLE IF NOT EXISTS perfis_lead (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  cpf TEXT,
  telefone TEXT,
  estado_uf TEXT,
  municipio TEXT,
  fazenda_nome TEXT,
  fazenda_area_ha NUMERIC,
  cultura_principal TEXT,
  finalidade_credito TEXT,
  valor_pretendido NUMERIC,
  banco_alvo TEXT,
  historico_credito TEXT,
  memoria_ia JSONB NOT NULL DEFAULT '{}'::jsonb,
  perguntas_respondidas_gratis INT NOT NULL DEFAULT 0,
  mini_analise_gerada_em TIMESTAMPTZ,
  mini_analise_texto TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE perfis_lead IS
  'Perfil estável e acumulativo do lead. 1:1 com auth.users. A IA AgroBridge acumula conhecimento aqui a cada conversa.';

COMMENT ON COLUMN perfis_lead.memoria_ia IS
  'Fatos livres acumulados pela IA (JSONB). Atualizado por deep-merge a cada turno.';
COMMENT ON COLUMN perfis_lead.perguntas_respondidas_gratis IS
  'Contador freemium 0-5. Ao atingir 5 em tier free, dispara mini-analise + paywall.';

ALTER TABLE perfis_lead ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS perfis_lead_select_self ON perfis_lead;
CREATE POLICY perfis_lead_select_self ON perfis_lead
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS perfis_lead_insert_self ON perfis_lead;
CREATE POLICY perfis_lead_insert_self ON perfis_lead
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS perfis_lead_update_self ON perfis_lead;
CREATE POLICY perfis_lead_update_self ON perfis_lead
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (user_id = auth.uid());

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION trigger_perfis_lead_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS perfis_lead_updated_at ON perfis_lead;
CREATE TRIGGER perfis_lead_updated_at
  BEFORE UPDATE ON perfis_lead
  FOR EACH ROW
  EXECUTE FUNCTION trigger_perfis_lead_updated_at();

-- Auto-cria perfil_lead quando user nasce em auth.users
CREATE OR REPLACE FUNCTION trigger_criar_perfil_lead_apos_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfis_lead (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS criar_perfil_lead_apos_signup ON auth.users;
CREATE TRIGGER criar_perfil_lead_apos_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_criar_perfil_lead_apos_signup();

-- Backfill: garante perfil_lead para todos os users existentes
INSERT INTO perfis_lead (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ---------- mensagens: adicionar user_id (modelo entrevista única) ----------
-- Abordagem A: user_id opcional coexiste com processo_id opcional.
-- Novas mensagens da entrevista única usam user_id. Legado mantém processo_id.
-- Motivo: menor risco, dados históricos preservados, policy dupla cobre os dois casos.

ALTER TABLE mensagens
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE mensagens ALTER COLUMN processo_id DROP NOT NULL;

-- Backfill user_id a partir do processo
UPDATE mensagens m
SET user_id = p.user_id
FROM processos p
WHERE m.processo_id = p.id AND m.user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_mensagens_user_id ON mensagens(user_id);

-- Constraint: mensagem precisa ter pelo menos um dos dois
ALTER TABLE mensagens DROP CONSTRAINT IF EXISTS mensagens_tem_dono;
ALTER TABLE mensagens ADD CONSTRAINT mensagens_tem_dono
  CHECK (user_id IS NOT NULL OR processo_id IS NOT NULL);

-- Policy atualizada: libera acesso via user_id OU processo_id (defense-in-depth)
DROP POLICY IF EXISTS mensagens_owner ON mensagens;
CREATE POLICY mensagens_owner ON mensagens
  FOR ALL TO authenticated
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR
    (processo_id IS NOT NULL AND processo_id IN (
      SELECT id FROM processos WHERE user_id = auth.uid()
    ))
  )
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR
    (processo_id IS NOT NULL AND processo_id IN (
      SELECT id FROM processos WHERE user_id = auth.uid()
    ))
  );
