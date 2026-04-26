-- ============================================================================
-- Pilar #1 — Estado consultável da entrega do dossiê
-- ----------------------------------------------------------------------------
-- Source of truth do status de geração/entrega do PDF do dossiê.
-- A IA consulta esta tabela ANTES de responder ao lead sobre "cadê meu PDF".
-- Sem isso, IA inventa prazo. Com isso, IA tem lastro factual.
--
-- State machine (transições válidas):
--   nao_iniciado → em_fila → gerando → pronto
--                                    ↘ erro → em_fila (retry)
--
-- Transições são ENFORCE via RPC (Wave 2). RLS bloqueia mutação direta.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Tabela
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dossie_entregas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- vínculos (1 entrega ativa por processo — idempotência via UNIQUE)
  processo_id   UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,

  -- estado atual (CHECK garante valor válido; transições via RPC)
  status        TEXT NOT NULL DEFAULT 'nao_iniciado'
                CHECK (status IN (
                  'nao_iniciado',
                  'em_fila',
                  'gerando',
                  'pronto',
                  'erro'
                )),

  -- tier no momento da entrega (snapshot — tier do lead pode mudar depois)
  tier_snapshot TEXT
                CHECK (tier_snapshot IS NULL OR tier_snapshot IN (
                  'diagnostico',
                  'dossie',
                  'mentoria'
                )),

  -- timestamps de transição (NULL = ainda não passou por aquele estado)
  enqueued_at   TIMESTAMPTZ,
  generating_at TIMESTAMPTZ,
  ready_at      TIMESTAMPTZ,
  errored_at    TIMESTAMPTZ,

  -- payload de saída
  pdf_url            TEXT,
  pdf_url_expires_at TIMESTAMPTZ,

  -- payload de erro (texto humano, NUNCA PII — sem nome/cpf/email)
  error_message TEXT,

  -- tentativas (retry policy futura)
  attempt_count INT NOT NULL DEFAULT 0,

  -- auditoria
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,

  -- 1 entrega por processo
  CONSTRAINT dossie_entregas_processo_unique UNIQUE (processo_id)
);

-- documentação viva (Postgres preserva COMMENTs)
COMMENT ON TABLE public.dossie_entregas IS
  'Source of truth da entrega do dossiê. IA consulta antes de responder.';
COMMENT ON COLUMN public.dossie_entregas.status IS
  'State machine: nao_iniciado→em_fila→gerando→(pronto|erro). Transições via RPC.';
COMMENT ON COLUMN public.dossie_entregas.error_message IS
  'Texto humano sem PII. Pode ser exibido ao lead.';

-- ----------------------------------------------------------------------------
-- 2) Indices (filtram deleted_at IS NULL — convenção LGPD)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_dossie_entregas_user_id
  ON public.dossie_entregas(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dossie_entregas_status
  ON public.dossie_entregas(status)
  WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 3) RLS — Row Level Security
-- ----------------------------------------------------------------------------
-- ESTRATÉGIA: SELECT permitido pro dono. INSERT/UPDATE/DELETE BLOQUEADOS
-- pra RLS — única porta de mutação é a RPC SECURITY DEFINER (Wave 2).
-- Isso força o state machine a passar pela validação de transição.
-- ----------------------------------------------------------------------------

ALTER TABLE public.dossie_entregas ENABLE ROW LEVEL SECURITY;

-- SELECT: dono lê seu próprio registro (não-deletado)
DROP POLICY IF EXISTS "dossie_entregas_select_owner" ON public.dossie_entregas;
CREATE POLICY "dossie_entregas_select_owner" ON public.dossie_entregas
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Sem policies de INSERT/UPDATE/DELETE = RLS nega por default.
-- Mutação só via RPC SECURITY DEFINER (Wave 2 cria `transicionar_dossie_entrega`).

-- ----------------------------------------------------------------------------
-- 4) Trigger de updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dossie_entregas_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dossie_entregas_updated_at ON public.dossie_entregas;
CREATE TRIGGER dossie_entregas_updated_at
  BEFORE UPDATE ON public.dossie_entregas
  FOR EACH ROW
  EXECUTE FUNCTION public.dossie_entregas_set_updated_at();
