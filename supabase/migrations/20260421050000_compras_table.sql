-- ============================================================
-- AgroBridge — Tabela `compras` (registro durável de transações)
-- ============================================================
-- Serve três propósitos independentes do `processos.perfil_json._tier`:
--   1) Fonte de verdade para reconciliação financeira (extornos,
--      chargebacks, auditoria contábil) — `processos` armazena o
--      estado efetivo do tier, `compras` armazena o histórico.
--   2) Substrato para a view `vagas_ouro_mes_corrente` que aplica
--      o limite global de 6 Mentorias/mês.
--   3) Exposição ao usuário via `/api/conta/exportar` (LGPD Art. 18).
--
-- Inserção exclusivamente via RPC `confirmar_pagamento_v2` (SECURITY
-- DEFINER). Policies bloqueiam INSERT/UPDATE/DELETE direto mesmo
-- para service_role — a RPC tem o contexto completo (processo_id,
-- idempotência, tier). Leitura permitida ao próprio owner via RLS.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.compras (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  processo_id             UUID REFERENCES public.processos(id) ON DELETE SET NULL,
  provider                TEXT NOT NULL CHECK (provider IN ('cakto', 'pagarme')),
  provider_transaction_id TEXT NOT NULL,
  provider_product_id     TEXT,
  tier                    TEXT NOT NULL CHECK (tier IN ('diagnostico', 'dossie', 'mentoria')),
  status                  TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'refunded', 'chargeback', 'failed')),
  amount_cents            INTEGER NOT NULL CHECK (amount_cents >= 0),
  paid_at                 TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at              TIMESTAMPTZ,

  -- Idempotência inter-provider — mesmo transaction_id no mesmo provider = 1 linha
  CONSTRAINT compras_provider_tx_unique UNIQUE (provider, provider_transaction_id)
);

COMMENT ON TABLE public.compras IS
  'Registro durável de cada transação financeira. Inserção via RPC confirmar_pagamento_v2 somente. Não use como fonte do tier efetivo — use processos.perfil_json._tier.';

-- Índices — queries típicas
CREATE INDEX IF NOT EXISTS idx_compras_user          ON public.compras(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_compras_status        ON public.compras(status);
CREATE INDEX IF NOT EXISTS idx_compras_tier_paid_at  ON public.compras(tier, paid_at DESC) WHERE status = 'paid';
CREATE INDEX IF NOT EXISTS idx_compras_created       ON public.compras(created_at DESC);

-- RLS — owner pode ler, nenhuma gravação direta
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS compras_owner_select ON public.compras;
CREATE POLICY compras_owner_select ON public.compras
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS compras_no_direct_insert ON public.compras;
CREATE POLICY compras_no_direct_insert ON public.compras
  FOR INSERT
  WITH CHECK (FALSE);

DROP POLICY IF EXISTS compras_no_direct_update ON public.compras;
CREATE POLICY compras_no_direct_update ON public.compras
  FOR UPDATE
  USING (FALSE);

DROP POLICY IF EXISTS compras_no_direct_delete ON public.compras;
CREATE POLICY compras_no_direct_delete ON public.compras
  FOR DELETE
  USING (FALSE);

-- Trigger para manter updated_at
CREATE OR REPLACE FUNCTION public.compras_tocar_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compras_updated_at ON public.compras;
CREATE TRIGGER trg_compras_updated_at
  BEFORE UPDATE ON public.compras
  FOR EACH ROW
  EXECUTE FUNCTION public.compras_tocar_updated_at();
