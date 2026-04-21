-- ============================================================
-- AgroBridge — View `vagas_mentoria_mes_corrente`
-- ============================================================
-- Aplica o limite global de 6 Mentorias pagas por mês calendário
-- (fuso UTC). Consultada pelo webhook antes de confirmar uma compra
-- de tier `mentoria`, e pelo endpoint /api/planos/vagas-mentoria
-- para exibir vagas restantes na UI de /planos.
--
-- A "mentoria" é o produto pago do tier mentoria (compras.tier = 'mentoria')
-- com status 'paid' e paid_at dentro do mês corrente.
-- ============================================================

CREATE OR REPLACE VIEW public.vagas_mentoria_mes_corrente AS
SELECT
  6                          AS limite_mensal,
  COUNT(*)::INTEGER          AS vagas_usadas,
  GREATEST(0, 6 - COUNT(*))::INTEGER AS vagas_restantes,
  date_trunc('month', NOW()) AS mes_referencia
FROM public.compras
WHERE tier = 'mentoria'
  AND status = 'paid'
  AND paid_at >= date_trunc('month', NOW())
  AND paid_at <  date_trunc('month', NOW()) + interval '1 month'
  AND deleted_at IS NULL;

COMMENT ON VIEW public.vagas_mentoria_mes_corrente IS
  'Contagem em tempo real de vagas de Mentoria consumidas no mês calendário UTC corrente. Limite fixo: 6/mês.';

-- Leitura para authenticated (view não tem RLS; o SELECT conta rows
-- independentemente do user, que é o comportamento desejado: qualquer
-- user autenticado pode ver vagas restantes para decidir se compra).
GRANT SELECT ON public.vagas_mentoria_mes_corrente TO authenticated;
GRANT SELECT ON public.vagas_mentoria_mes_corrente TO service_role;
