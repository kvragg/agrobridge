-- ============================================================
-- AgroBridge — Hardening RLS uploads (C3 Red Team · Eixo 1)
-- Migration aditiva. Substitui a policy 'uploads_owner' por uma
-- que valida ownership transitivo: user_id = auth.uid()
-- E checklist_item_id pertence a processo do mesmo usuário.
-- Fecha o vetor de cross-tenant poisoning por enumeração de UUID.
-- ============================================================

DROP POLICY IF EXISTS "uploads_owner" ON uploads;

CREATE POLICY "uploads_owner" ON uploads
  FOR ALL
  USING (
    user_id = auth.uid()
    AND checklist_item_id IN (
      SELECT ci.id
      FROM checklist_itens ci
      JOIN processos p ON p.id = ci.processo_id
      WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND checklist_item_id IN (
      SELECT ci.id
      FROM checklist_itens ci
      JOIN processos p ON p.id = ci.processo_id
      WHERE p.user_id = auth.uid()
    )
  );
