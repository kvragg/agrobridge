-- ============================================================================
-- AgroBridge v1.1 — Frente A: lembretes_agendados
-- ----------------------------------------------------------------------------
-- Tabela de auditoria + idempotência dos lembretes que o cron diário envia
-- pra leads pagantes. Cron `/api/cron/lembretes` roda 09h BRT, identifica
-- candidatos por tipo de lembrete, evita duplicados via SELECT prévio
-- (anti-frequência: 1 do mesmo tipo a cada 7 dias por lead) e dispara
-- email via Resend.
--
-- Tipos suportados v1.1.0:
--   processo_dormente          — checklist <50% após 14d sem upload
--   dossie_pronto_nao_baixado  — PDF gerado >24h sem download
--
-- Tipos planejados v1.1.2:
--   documento_vencendo         — CAR/CCIR/ITR <30d de validade
--   vagas_mentoria_baixas      — fim do mês, vagas Ouro abertas
--
-- Mutação só por service_role (cron). RLS permite SELECT do dono pra
-- futura UI de "histórico de lembretes" em /conta.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lembretes_agendados (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  tipo            TEXT NOT NULL CHECK (tipo IN (
                    'processo_dormente',
                    'dossie_pronto_nao_baixado',
                    'documento_vencendo',
                    'vagas_mentoria_baixas'
                  )),

  -- Snapshot do contexto no momento do envio (processo_id, % checklist,
  -- nome do doc vencendo, etc). Texto humano também vai junto pro
  -- template de email não precisar refazer queries.
  contexto        JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Email destino no momento do envio (auditoria — user pode mudar depois)
  email_destino   TEXT,

  -- Rastreabilidade do envio
  enviado_em      TIMESTAMPTZ,
  resend_id       TEXT,            -- message_id retornado pelo Resend
  envio_falhou    BOOLEAN NOT NULL DEFAULT FALSE,
  erro_mensagem   TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE public.lembretes_agendados IS
  'Histórico de lembretes inteligentes (cron diário). 1 row por envio. Anti-duplicate via query prévia (SELECT últimos 7d do mesmo tipo+user).';

-- Index principal: query do cron e UI de histórico do user
CREATE INDEX IF NOT EXISTS lembretes_user_tipo_enviado_idx
  ON public.lembretes_agendados (user_id, tipo, enviado_em DESC)
  WHERE deleted_at IS NULL;

-- Index secundário: retroação rápida no admin (debug)
CREATE INDEX IF NOT EXISTS lembretes_enviado_em_idx
  ON public.lembretes_agendados (enviado_em DESC)
  WHERE deleted_at IS NULL AND enviado_em IS NOT NULL;

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.lembretes_agendados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lembretes_select_owner ON public.lembretes_agendados;
CREATE POLICY lembretes_select_owner ON public.lembretes_agendados
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- INSERT/UPDATE/DELETE bloqueados pra qualquer caller que não seja
-- service_role (cron). Sem policies = nega por default em RLS.
DROP POLICY IF EXISTS lembretes_no_direct_insert ON public.lembretes_agendados;
CREATE POLICY lembretes_no_direct_insert ON public.lembretes_agendados
  FOR INSERT
  WITH CHECK (FALSE);

DROP POLICY IF EXISTS lembretes_no_direct_update ON public.lembretes_agendados;
CREATE POLICY lembretes_no_direct_update ON public.lembretes_agendados
  FOR UPDATE
  USING (FALSE);
