-- 2026-04-25: email alternativo pra leads com email corporativo
--
-- Contexto: leads cadastrando com email corporativo (Sicredi, BB, gov etc)
-- não recebem nossos emails — TI institucional bloqueia na borda do
-- firewall, antes do filtro de spam. Solução pragmática: pedir um email
-- alternativo (gmail/outlook pessoal) e enviar cópia dos emails críticos
-- (boas-vindas, pagamento confirmado, dossiê pronto, lembretes).
--
-- IDEMPOTENTE: usa IF NOT EXISTS, segura pra rodar de novo.
-- ADITIVA: só ADD COLUMN, sem DROP. Sem perda de dados.

ALTER TABLE public.perfis_lead
  ADD COLUMN IF NOT EXISTS email_alternativo TEXT;

COMMENT ON COLUMN public.perfis_lead.email_alternativo IS
  'Email pessoal opcional pra recebimento duplicado quando email principal '
  'é corporativo (lib/email/dominios-corporativos.ts detecta). Pra leads '
  'com Sicredi/BB/gov, sistema envia emails críticos pra ambos.';
