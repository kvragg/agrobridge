-- 2026-04-25: lead_type (PF/PJ) + tabela de sócios
--
-- Contexto: até hoje, checklist e entrevista assumiam Pessoa Física.
-- Brasil agro tem MUITO produtor com PJ rural (cooperativa, fazenda
-- como empresa, holding patrimonial). Precisa contemplar PJ sem virar
-- bagunça pro cliente — regra de ouro: o lead vê só o que se aplica
-- a ele.
--
-- IDEMPOTENTE: usa IF NOT EXISTS / CREATE POLICY IF NOT EXISTS.
-- ADITIVA: só ADD COLUMN + CREATE TABLE. Sem perda de dados.
-- Lead pré-existente continua como 'pf' por default.

ALTER TABLE public.perfis_lead
  ADD COLUMN IF NOT EXISTS lead_type TEXT NOT NULL DEFAULT 'pf'
    CHECK (lead_type IN ('pf', 'pj')),
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS razao_social TEXT;

COMMENT ON COLUMN public.perfis_lead.lead_type IS
  'Pessoa Física (pf) ou Pessoa Jurídica (pj). PJ desbloqueia grupos '
  'Empresa + Sócios no checklist. Default pf preserva leads pré-25/04.';

COMMENT ON COLUMN public.perfis_lead.cnpj IS
  'CNPJ da empresa (só preenchido se lead_type=pj).';

COMMENT ON COLUMN public.perfis_lead.razao_social IS
  'Razão social da empresa (só preenchido se lead_type=pj).';

-- Tabela de sócios — 1 linha por sócio da PJ. Cliente PF não tem
-- registro aqui. display_order define a ordem visual no UI.
CREATE TABLE IF NOT EXISTS public.perfil_socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  estado_civil TEXT NOT NULL
    CHECK (estado_civil IN ('solteiro','casado','uniao_estavel','divorciado','viuvo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (user_id, display_order)
);

CREATE INDEX IF NOT EXISTS idx_perfil_socios_user
  ON public.perfil_socios(user_id) WHERE deleted_at IS NULL;

ALTER TABLE public.perfil_socios ENABLE ROW LEVEL SECURITY;

-- Self-read: lead só lê próprios sócios.
DROP POLICY IF EXISTS "perfil_socios_self_read" ON public.perfil_socios;
CREATE POLICY "perfil_socios_self_read" ON public.perfil_socios
  FOR SELECT USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Self-write: lead só insere/atualiza/deleta próprios sócios.
DROP POLICY IF EXISTS "perfil_socios_self_write" ON public.perfil_socios;
CREATE POLICY "perfil_socios_self_write" ON public.perfil_socios
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.perfil_socios IS
  'Sócios da PJ. Cliente PF não tem registro aqui. Cada sócio recebe '
  'seu próprio bloco de docs no checklist (CNH, residência, IR, '
  'certidão casamento + CNH cônjuge se casado). Soft delete via '
  'deleted_at — preserva docs anexados em caso de remoção acidental.';
