-- ============================================================
-- AgroBridge — uploads aceita anexo via chat flutuante
-- ============================================================
-- Contexto: o widget IA flutuante (Fase A) deixa o lead anexar
-- docs direto na conversa. Antes, uploads.checklist_item_id era
-- NOT NULL — bloqueava anexo se o user pago ainda não tivesse
-- checklist gerado.
--
-- Solução (Opção Y do plano): torna checklist_item_id NULLABLE
-- e adiciona processo_id NOT NULL como referência primária de
-- ownership. Fluxo:
--   1. User anexa doc no chat → storage + uploads(processo_id, ...)
--   2. Se IA reconhece o tipo (CAR, CCIR...) e existe
--      checklist_itens correspondente, vincula checklist_item_id
--   3. Senão, fica órfão e o gerador de checklist associa depois
--
-- RLS: agora valida ownership via processos.user_id (era via
-- checklist_itens.processo_id.user_id). Segurança preservada —
-- storage bucket mantém o mesmo path-based policy.
-- ============================================================

BEGIN;

-- 1) Adicionar processo_id (nullable temporariamente pra backfill)
ALTER TABLE uploads
  ADD COLUMN IF NOT EXISTS processo_id UUID
    REFERENCES processos(id) ON DELETE CASCADE;

-- 2) Backfill: processo_id derivado do checklist_item_id existente
UPDATE uploads u
SET processo_id = ci.processo_id
FROM checklist_itens ci
WHERE u.checklist_item_id = ci.id
  AND u.processo_id IS NULL;

-- 3) Agora processo_id vira NOT NULL (todos os registros têm)
ALTER TABLE uploads
  ALTER COLUMN processo_id SET NOT NULL;

-- 4) checklist_item_id vira NULLABLE (permite anexo antes do checklist)
ALTER TABLE uploads
  ALTER COLUMN checklist_item_id DROP NOT NULL;

-- 5) Novas colunas opcionais pro contexto do anexo via chat
ALTER TABLE uploads
  ADD COLUMN IF NOT EXISTS origem TEXT
    CHECK (origem IN ('checklist', 'chat_widget', 'entrevista')),
  ADD COLUMN IF NOT EXISTS doc_slug_sugerido TEXT,  -- inferido pela IA ('car', 'ccir', etc)
  ADD COLUMN IF NOT EXISTS validacao_status TEXT
    CHECK (validacao_status IN ('pendente', 'ok', 'rejeitado', 'warning'));

-- 6) Índice pra queries por processo (dashboard/checklist)
CREATE INDEX IF NOT EXISTS idx_uploads_processo
  ON uploads(processo_id);

-- 7) Substituir policy — agora valida via processo direto
-- (a anterior exigia checklist_item_id não nulo)
DROP POLICY IF EXISTS "uploads_owner" ON uploads;

CREATE POLICY "uploads_owner" ON uploads
  FOR ALL
  USING (
    user_id = auth.uid()
    AND processo_id IN (
      SELECT id FROM processos WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND processo_id IN (
      SELECT id FROM processos WHERE user_id = auth.uid()
    )
  );

COMMIT;

-- ============================================================
-- Notas de compatibilidade:
--
-- Código existente que INSERTa em uploads (app/api/documento/
-- validar/route.ts) continua funcionando se já passa
-- checklist_item_id — basta adicionar processo_id (derivável via
-- checklist_itens.processo_id no mesmo fetch).
--
-- Código do widget (Fase A) vai inserir:
--   processo_id (sempre)
--   checklist_item_id (NULL se IA não identificou o doc)
--   origem = 'chat_widget'
--   doc_slug_sugerido (slug canônico MCR)
--   validacao_status = 'pendente' (ou resultado da IA)
-- ============================================================
