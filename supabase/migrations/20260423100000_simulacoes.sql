-- ============================================================
-- AgroBridge — Tabela simulacoes (Simulador de Viabilidade)
-- ============================================================
-- Cada user pode salvar suas simulações pra:
--   1. Comparar cenários ao longo do tempo (rota /simulador/historico)
--   2. Voltar pro mesmo cenário sem ter que digitar tudo de novo
--   3. Métrica do funil — quem simula >2x converte mais
--
-- RLS: cada user só vê e cria as próprias.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.simulacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input           JSONB NOT NULL,           -- SimulatorInput completo
  output          JSONB NOT NULL,           -- SimulatorResult completo
  score           INT NOT NULL,             -- Cache pra queries rápidas
  cultura         TEXT NOT NULL,            -- Cache pra filtro por cultura
  valor_pretendido NUMERIC(14, 2) NOT NULL, -- Cache
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT score_range CHECK (score >= 0 AND score <= 100)
);

ALTER TABLE public.simulacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "simulacoes_select_owner" ON public.simulacoes;
CREATE POLICY "simulacoes_select_owner" ON public.simulacoes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "simulacoes_insert_owner" ON public.simulacoes;
CREATE POLICY "simulacoes_insert_owner" ON public.simulacoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "simulacoes_delete_owner" ON public.simulacoes;
CREATE POLICY "simulacoes_delete_owner" ON public.simulacoes
  FOR DELETE USING (auth.uid() = user_id);

-- Index pra ordenação cronológica por user
CREATE INDEX IF NOT EXISTS simulacoes_user_created_idx
  ON public.simulacoes (user_id, created_at DESC);

-- Index secundário pra filtro por cultura no histórico
CREATE INDEX IF NOT EXISTS simulacoes_user_cultura_idx
  ON public.simulacoes (user_id, cultura);
