-- ============================================================
-- AgroBridge — RPC `soft_delete_processo` (cascata atomica)
-- ============================================================
-- Problema que motivou esta migration:
--   O DELETE em app/api/processos/[id]/route.ts marcava
--   processos.deleted_at via cliente user, depois tentava marcar
--   mensagens/checklist_itens/uploads. Porem as policies RLS desses
--   filhos exigem EXISTS(SELECT 1 FROM processos WHERE user_id = auth.uid()
--   AND deleted_at IS NULL) — apos o soft-delete do pai, a policy
--   devolve falso e os filhos ficam com deleted_at = NULL. Isso
--   vazava mensagens/uploads para exportacao LGPD e scans defensivos.
--
-- Solucao:
--   RPC SECURITY DEFINER que faz a cascata em UMA unica transacao,
--   chamada pelo admin client (service_role). A RPC valida ownership
--   (p_user_id = processos.user_id) antes de executar. Idempotente:
--   reexecutar com mesmo processo_id e no-op.
-- ============================================================

CREATE OR REPLACE FUNCTION public.soft_delete_processo(
  p_processo_id UUID,
  p_user_id     UUID
)
RETURNS TABLE (
  processos_excluidos       INTEGER,
  mensagens_excluidas       INTEGER,
  checklist_itens_excluidos INTEGER,
  uploads_excluidos         INTEGER,
  ja_excluido               BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now               TIMESTAMPTZ := NOW();
  v_owner             UUID;
  v_ja_excluido       BOOLEAN := FALSE;
  v_procs             INTEGER := 0;
  v_msgs              INTEGER := 0;
  v_items             INTEGER := 0;
  v_ups               INTEGER := 0;
BEGIN
  -- Valida ownership (sem RLS porque SECURITY DEFINER)
  SELECT p.user_id, (p.deleted_at IS NOT NULL)
    INTO v_owner, v_ja_excluido
  FROM public.processos p
  WHERE p.id = p_processo_id;

  IF v_owner IS NULL THEN
    -- Processo inexistente — idempotente
    RETURN QUERY SELECT 0, 0, 0, 0, TRUE;
    RETURN;
  END IF;

  IF v_owner <> p_user_id THEN
    -- Nao autorizado (defense-in-depth; o chamador deve ter validado antes)
    RAISE EXCEPTION 'nao_autorizado' USING ERRCODE = '42501';
  END IF;

  IF v_ja_excluido THEN
    -- Ja soft-deletado; no-op
    RETURN QUERY SELECT 0, 0, 0, 0, TRUE;
    RETURN;
  END IF;

  -- Cascata: filhos primeiro, pai por ultimo (mas como SECURITY DEFINER
  -- bypassa RLS, a ordem aqui e apenas por clareza).
  UPDATE public.mensagens
     SET deleted_at = v_now
   WHERE processo_id = p_processo_id
     AND deleted_at IS NULL;
  GET DIAGNOSTICS v_msgs = ROW_COUNT;

  UPDATE public.checklist_itens
     SET deleted_at = v_now
   WHERE processo_id = p_processo_id
     AND deleted_at IS NULL;
  GET DIAGNOSTICS v_items = ROW_COUNT;

  UPDATE public.uploads u
     SET deleted_at = v_now
    FROM public.checklist_itens ci
   WHERE ci.processo_id = p_processo_id
     AND u.checklist_item_id = ci.id
     AND u.deleted_at IS NULL;
  GET DIAGNOSTICS v_ups = ROW_COUNT;

  UPDATE public.processos
     SET deleted_at = v_now
   WHERE id = p_processo_id
     AND deleted_at IS NULL;
  GET DIAGNOSTICS v_procs = ROW_COUNT;

  RETURN QUERY SELECT v_procs, v_msgs, v_items, v_ups, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.soft_delete_processo(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_processo(UUID, UUID) TO service_role;

COMMENT ON FUNCTION public.soft_delete_processo(UUID, UUID) IS
  'Cascata atomica de soft-delete em processos/mensagens/checklist_itens/uploads. Chamar via admin client apos validar auth.uid() == p_user_id.';
