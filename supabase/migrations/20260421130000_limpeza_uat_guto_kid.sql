-- ============================================================
-- Onda 2 — Limpeza UAT Iteracao 2 (Opcao A confirmada por Paulo)
-- ============================================================
-- Soft-delete dos processos de teste de guto_kid@hotmail.com.
-- Operacao pre-autorizada explicitamente pelo Paulo como Opcao A.
-- Idempotente: WHERE deleted_at IS NULL garante que segunda execucao
-- e no-op.
--
-- Aplicada em producao via Supabase MCP em 2026-04-21.
-- Arquivo versionado para historico / reprodutibilidade em staging.
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
  v_processo RECORD;
  v_total_procs INT := 0;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = 'guto_kid@hotmail.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'guto_kid@hotmail.com nao encontrado; no-op';
    RETURN;
  END IF;

  FOR v_processo IN
    SELECT id FROM public.processos WHERE user_id = v_user_id AND deleted_at IS NULL
  LOOP
    PERFORM public.soft_delete_processo(v_processo.id, v_user_id);
    v_total_procs := v_total_procs + 1;
  END LOOP;

  -- Seed do perfil_lead (ja existe por backfill da 20260421120000, mas garante nome)
  UPDATE public.perfis_lead
     SET nome = COALESCE(nome, 'Paulo')
   WHERE user_id = v_user_id;

  -- Audit (so registra se houve mudanca efetiva)
  IF v_total_procs > 0 THEN
    INSERT INTO public.audit_events (user_id, event_type, target_id, payload)
    VALUES (
      v_user_id,
      'processo_excluido',
      'limpeza_uat_iteracao2',
      jsonb_build_object(
        'motivo', 'limpeza_uat_iteracao2_opcao_a',
        'processos_soft_deletados', v_total_procs,
        'executado_em', now()
      )
    );
  END IF;

  RAISE NOTICE 'Limpeza guto_kid: % processos soft-deletados', v_total_procs;
END $$;
