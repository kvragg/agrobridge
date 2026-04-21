-- Hotfix Onda 2: a limpeza UAT (commit b2ede4e) soft-deletou TODOS os
-- processos do guto_kid sem filtrar pagamento_confirmado. Isso fez o
-- processo que confirmou a compra Bronze (R$29,99, commit ea2e8d3)
-- ficar deleted_at<>NULL, e getPlanoAtual ler null tier.
--
-- Fix aplicado em paralelo ao refactor de lib/plano.ts (agora lê de
-- `compras`, fonte-da-verdade imutável). Essa migration:
-- 1) restaura o processo pago (UNDELETE) pra manter consistência;
-- 2) atualiza o comment da tabela compras (era "não use como fonte").
-- 3) audita como hotfix_regressao_tier.

-- (1) Undelete do processo pago + registrar evento
WITH processos_a_restaurar AS (
  SELECT p.id, p.user_id
  FROM processos p
  INNER JOIN compras c ON c.processo_id = p.id AND c.status = 'paid'
  WHERE p.deleted_at IS NOT NULL
)
UPDATE processos
SET deleted_at = NULL
WHERE id IN (SELECT id FROM processos_a_restaurar);

-- (2) Atualiza o comentário — compras agora é canônica
COMMENT ON TABLE compras IS
  'Registro durável de cada transação financeira (inserção via RPC confirmar_pagamento_v2). FONTE-DA-VERDADE do tier efetivo do user — ver lib/plano.ts::getPlanoAtual. Processos podem ser soft-deletados, compras são imutáveis.';

-- (3) Audit trail do hotfix
INSERT INTO audit_events (event_type, user_id, target_id, payload)
SELECT
  'hotfix_regressao_tier',
  p.user_id,
  p.id::text,
  jsonb_build_object(
    'motivo', 'limpeza UAT Onda 2 deletou processo pago',
    'compra_id', c.id::text,
    'tier_restaurado', c.tier,
    'migration', '20260421140000_hotfix_regressao_tier'
  )
FROM processos p
INNER JOIN compras c ON c.processo_id = p.id AND c.status = 'paid'
WHERE p.user_id IN (
  SELECT p2.user_id
  FROM processos p2
  WHERE p2.id IN (
    SELECT processo_id FROM compras WHERE status = 'paid'
  )
);
