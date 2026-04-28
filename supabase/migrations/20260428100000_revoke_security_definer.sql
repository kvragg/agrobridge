-- ============================================================================
-- Hardening pos ONDA 5 da auditoria (2026-04-28)
-- ----------------------------------------------------------------------------
-- Supabase advisor flaggou 9 funcoes SECURITY DEFINER callable por anon
-- e/ou authenticated. Varias dessas so sao chamadas via admin client
-- (service_role) — NUNCA por sessao de usuario. Manter o GRANT EXECUTE
-- pra anon/authenticated abria vetor de:
--
--   - confirmar_pagamento_v2: forjar pagamento sem passar pelo webhook
--     (atacante autenticado -> POST /rest/v1/rpc/confirmar_pagamento_v2)
--   - rls_auto_enable: privilege escalation via toggle de RLS
--   - soft_delete_user_data/_processo: pular dupla confirmacao por email
--   - trigger_criar_perfil_lead_apos_signup: trigger function exposta
--     como RPC (anti-pattern)
--
-- Service_role NAO eh afetado pelo REVOKE — admin client continua chamando.
--
-- transicionar_dossie_entrega FICA com authenticated porque o tracker
-- (lib/dossie/entrega-tracker.ts) eh chamado a partir de rotas API com
-- supabase server client (user context) e a funcao tem validacao interna
-- de auth.uid() vs processos.user_id.
-- ============================================================================

-- Webhook + reprocessar — so service_role
REVOKE EXECUTE ON FUNCTION public.confirmar_pagamento_v2(
  uuid, text, text, text, text, jsonb, integer, text
) FROM anon, authenticated;

-- Funcao admin de toggle RLS — so service_role
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, PUBLIC;

-- Soft delete — chamados via admin client apos validacao no backend
REVOKE EXECUTE ON FUNCTION public.soft_delete_user_data(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.soft_delete_processo(uuid, uuid) FROM anon, authenticated;

-- Trigger function exposta como RPC — nao eh endpoint, eh gatilho interno
REVOKE EXECUTE ON FUNCTION public.trigger_criar_perfil_lead_apos_signup() FROM anon, authenticated, PUBLIC;

COMMENT ON FUNCTION public.confirmar_pagamento_v2(
  uuid, text, text, text, text, jsonb, integer, text
) IS 'Webhook/admin only. Service_role required. REVOKEd from anon/authenticated em 2026-04-28 (auditoria ONDA 5).';
COMMENT ON FUNCTION public.rls_auto_enable() IS
  'Admin tooling. Service_role only. REVOKEd em 2026-04-28.';
COMMENT ON FUNCTION public.soft_delete_user_data(uuid) IS
  'LGPD soft delete em cascata. Backend chama via admin client apos dupla confirmacao por email. REVOKEd em 2026-04-28.';
COMMENT ON FUNCTION public.soft_delete_processo(uuid, uuid) IS
  'Soft delete de processo. Backend chama via admin client. REVOKEd em 2026-04-28.';
COMMENT ON FUNCTION public.trigger_criar_perfil_lead_apos_signup() IS
  'Trigger interna apos signup. Nao eh RPC publico. REVOKEd em 2026-04-28.';
