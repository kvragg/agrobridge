-- ============================================================
-- AgroBridge — bucket de documentos aceita até 100MB por arquivo
-- ============================================================
-- Contexto: pedido do Paulo (2026-04-22) — checklist extenso
-- pode exigir anexos grandes (ex: PDF escaneado completo da
-- matrícula com muitas páginas, laudo agronômico denso, balanço
-- PJ com anexos). Default do Supabase era 50MB.
--
-- IMPORTANTE — limite duplo:
--   - Upload no Storage: até 100MB (esta migration)
--   - Validação automática pela IA: até 20MB
--     (acima disso, doc é armazenado mas marcado "validação manual" —
--      contexto do Claude não acomoda PDFs muito grandes)
-- ============================================================

UPDATE storage.buckets
SET file_size_limit = 100 * 1024 * 1024,  -- 100 MB
    allowed_mime_types = ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
WHERE id = 'documentos';
