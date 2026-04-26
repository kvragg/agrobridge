-- ============================================================================
-- Hardening: function_search_path_mutable (Supabase advisor 0011)
-- ----------------------------------------------------------------------------
-- Funções sem `SET search_path` ficam vulneráveis a search_path hijacking
-- por chamadores que mexam no search_path da sessão. Setar explicitamente
-- garante que a função use sempre o schema correto.
--
-- Aplicado em todas as funções de trigger updated_at + a nova
-- dossie_entregas_set_updated_at (criada por 20260425160000).
-- ============================================================================

ALTER FUNCTION public.dossie_entregas_set_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.compras_tocar_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.trigger_perfis_lead_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_updated_at()
  SET search_path = public, pg_temp;
