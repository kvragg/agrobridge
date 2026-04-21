-- ============================================================
-- AgroBridge — Soft-delete em tabelas com PII
-- ============================================================
-- Adiciona coluna `deleted_at TIMESTAMPTZ` em tabelas do fluxo
-- principal que ainda não têm (processos, mensagens, checklist_itens,
-- uploads). Atualiza policies RLS para esconder registros com
-- `deleted_at IS NOT NULL` do owner — mantém service_role com
-- acesso total para backfill/reconciliação.
--
-- Motivação: LGPD Art. 18 (direito à eliminação) + necessidade
-- de manter rastro para obrigações fiscais (Art. 7 §V). A exclusão
-- real (DROP ROW) só acontece após janela de retenção (5 anos,
-- conforme seção 7 da Política de Privacidade). Até lá, o soft
-- delete esconde os dados do app e bloqueia qualquer uso.
--
-- Tabelas cobertas:
--   - processos, mensagens, checklist_itens, uploads   (fluxo)
--   - compras já tem `deleted_at` (migration 20260421050000)
--
-- Tabelas NÃO cobertas (intencional):
--   - audit_events     — append-only por design (rastro de segurança)
--   - webhook_events   — idempotência de processadores externos
-- ============================================================

-- 1) Adiciona colunas deleted_at (idempotente)
ALTER TABLE public.processos       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.mensagens       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.checklist_itens ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.uploads         ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2) Índices parciais para queries que filtram por deleted_at IS NULL
CREATE INDEX IF NOT EXISTS idx_processos_active
  ON public.processos(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mensagens_active
  ON public.mensagens(processo_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_checklist_itens_active
  ON public.checklist_itens(processo_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_uploads_active
  ON public.uploads(user_id) WHERE deleted_at IS NULL;

-- 3) Rewrite policies — owner enxerga apenas linhas ativas.
--    service_role ignora RLS, portanto mantém acesso total para
--    backfill, reconciliação e jobs de retenção.

-- processos
DROP POLICY IF EXISTS "processos_owner" ON public.processos;
CREATE POLICY "processos_owner" ON public.processos
  FOR ALL
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (user_id = auth.uid());

-- mensagens (ownership transitiva via processos)
DROP POLICY IF EXISTS "mensagens_owner" ON public.mensagens;
CREATE POLICY "mensagens_owner" ON public.mensagens
  FOR ALL
  USING (
    deleted_at IS NULL
    AND processo_id IN (
      SELECT id FROM public.processos
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- checklist_itens (ownership transitiva via processos)
DROP POLICY IF EXISTS "checklist_owner" ON public.checklist_itens;
CREATE POLICY "checklist_owner" ON public.checklist_itens
  FOR ALL
  USING (
    deleted_at IS NULL
    AND processo_id IN (
      SELECT id FROM public.processos
      WHERE user_id = auth.uid() AND deleted_at IS NULL
    )
  );

-- uploads (ownership direta + transitiva — mantém o hardening
-- da migration 20260419010000 mas filtra por deleted_at)
DROP POLICY IF EXISTS "uploads_owner" ON public.uploads;
CREATE POLICY "uploads_owner" ON public.uploads
  FOR ALL
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
    AND checklist_item_id IN (
      SELECT ci.id
      FROM public.checklist_itens ci
      JOIN public.processos p ON p.id = ci.processo_id
      WHERE p.user_id = auth.uid() AND p.deleted_at IS NULL
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND checklist_item_id IN (
      SELECT ci.id
      FROM public.checklist_itens ci
      JOIN public.processos p ON p.id = ci.processo_id
      WHERE p.user_id = auth.uid()
    )
  );

-- 4) Função utilitária para soft-delete em cascata (usada pela
-- RPC de exclusão de conta). SECURITY DEFINER para contornar RLS
-- ao gravar deleted_at em filhos. Retorna contadores para auditoria.
CREATE OR REPLACE FUNCTION public.soft_delete_user_data(p_user_id UUID)
RETURNS TABLE (
  processos_afetados     INTEGER,
  mensagens_afetadas     INTEGER,
  checklist_afetados     INTEGER,
  uploads_afetados       INTEGER,
  compras_afetadas       INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proc INTEGER := 0;
  v_msg  INTEGER := 0;
  v_chk  INTEGER := 0;
  v_up   INTEGER := 0;
  v_comp INTEGER := 0;
  v_now  TIMESTAMPTZ := NOW();
BEGIN
  -- Uploads do user (via ownership direta)
  UPDATE public.uploads
     SET deleted_at = v_now
   WHERE user_id = p_user_id AND deleted_at IS NULL;
  GET DIAGNOSTICS v_up = ROW_COUNT;

  -- Checklist itens dos processos do user
  UPDATE public.checklist_itens ci
     SET deleted_at = v_now
    FROM public.processos p
   WHERE ci.processo_id = p.id
     AND p.user_id = p_user_id
     AND ci.deleted_at IS NULL;
  GET DIAGNOSTICS v_chk = ROW_COUNT;

  -- Mensagens dos processos do user
  UPDATE public.mensagens m
     SET deleted_at = v_now
    FROM public.processos p
   WHERE m.processo_id = p.id
     AND p.user_id = p_user_id
     AND m.deleted_at IS NULL;
  GET DIAGNOSTICS v_msg = ROW_COUNT;

  -- Processos do user
  UPDATE public.processos
     SET deleted_at = v_now
   WHERE user_id = p_user_id AND deleted_at IS NULL;
  GET DIAGNOSTICS v_proc = ROW_COUNT;

  -- Compras (histórico permanece; só marca deleted_at p/ esconder do
  -- endpoint de exportação e bloquear SELECT do owner via RLS)
  UPDATE public.compras
     SET deleted_at = v_now
   WHERE user_id = p_user_id AND deleted_at IS NULL;
  GET DIAGNOSTICS v_comp = ROW_COUNT;

  RETURN QUERY SELECT v_proc, v_msg, v_chk, v_up, v_comp;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_user_data(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_user_data(UUID) TO service_role;

-- 5) Tabela de pedidos de exclusão (dupla confirmação)
-- ----------------------------------------------------------------
-- Armazena HASH sha-256 do token de confirmação (nunca o token em
-- texto claro). TTL 30 min. Consumido atomicamente — após
-- confirmação, status = 'confirmado' e tokens futuros com mesmo
-- hash falham.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedidos_exclusao_conta (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash     TEXT NOT NULL,
  ip             TEXT,
  user_agent     TEXT,
  expira_em      TIMESTAMPTZ NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pendente'
                   CHECK (status IN ('pendente', 'confirmado', 'expirado', 'cancelado')),
  confirmado_em  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pedidos_excl_token_unique UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_excl_user
  ON public.pedidos_exclusao_conta(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_excl_pendentes
  ON public.pedidos_exclusao_conta(token_hash)
  WHERE status = 'pendente';

ALTER TABLE public.pedidos_exclusao_conta ENABLE ROW LEVEL SECURITY;

-- Nenhum acesso direto — tudo via service_role (route handler).
-- Leitura futura para "minhas solicitações" pode ser liberada depois
-- se precisar mostrar histórico.
DROP POLICY IF EXISTS pedidos_excl_no_select ON public.pedidos_exclusao_conta;
CREATE POLICY pedidos_excl_no_select ON public.pedidos_exclusao_conta
  FOR SELECT USING (FALSE);
DROP POLICY IF EXISTS pedidos_excl_no_write ON public.pedidos_exclusao_conta;
CREATE POLICY pedidos_excl_no_write ON public.pedidos_exclusao_conta
  FOR ALL USING (FALSE) WITH CHECK (FALSE);
