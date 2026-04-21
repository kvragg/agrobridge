# Audit Log — Auditoria Noturna AgroBridge

Log contínuo, append-only. Cada entrada: `[timestamp] Iteração N — Batch X — título`.

## [2026-04-21 00:00] Iteração 1 — Setup
**Ação:** Branch `audit-2026-04-20` criada a partir de `main @ 440250b`.
**Stash:** `.claude/settings.local.json` salvo em stash (mudança local não relacionada).
**Estrutura:** `audit/` + `audit/scratch/` criados. `audit/scratch/` adicionado ao `.gitignore`.
**Estado inicial:** 17 testes integration passing, build limpo, zero typecheck errors.

## [2026-04-21 00:40] Iteração 1 — Batch 1 (Wave 1)
**Ação:** Open redirect defense-in-depth + cache no-store para rotas autenticadas.
**Arquivos:**
- `lib/safe-redirect.ts` (novo) — `sanitizarCaminhoInterno()` reutilizável
- `app/auth/callback/route.ts` — usa helper compartilhado (remove duplicação)
- `app/(auth)/login/page.tsx:30` — sanitiza `?next=` antes de `router.push`
- `proxy.ts` — rotas `/planos` e `/conta` adicionadas a `ROTAS_PROTEGIDAS_WEB`; `Cache-Control` reforçado com `no-cache, must-revalidate, private` + `Pragma: no-cache`; comentário Pagar.me → Cakto
- `scripts/check-secrets.sh` (novo) — grep pré-commit para sk-ant, service role, Cakto secret, etc.
- `tests/integration/audit-events.test.ts:75` — fix typecheck `Tuple type '[]'`
- `components/ui/dashboard-shell.tsx:22-26` — `useEffect(setOpen(false))` → padrão sem cascading render (ESLint error)

**Build:** ✅ (proxy detectado)
**Typecheck:** ✅ zero erros
**Lint:** ✅ zero errors (11 warnings pré-existentes, não regressão)
**Tests:** ⚠️ bloqueados por WDAC no rolldown-binding — documentado na fila (#9)

Commit: wave 1 — defense in depth open redirect + no-store + check-secrets

## [2026-04-21 01:20] Iteração 1 — Batch 2 (Wave 2)
**Ação:** Tabela `compras` + view `vagas_mentoria_mes_corrente` + RPC v3 (grava em compras, gate 6/mês Mentoria) + endpoint + UI de vagas.
**Arquivos:**
- `supabase/migrations/20260421050000_compras_table.sql` (novo) — tabela compras com RLS owner-select + CHECKs + UNIQUE (provider, tx_id) + trigger updated_at. Bloqueia INSERT/UPDATE/DELETE direto mesmo para service_role — tudo via RPC.
- `supabase/migrations/20260421060000_vagas_mentoria_view.sql` (novo) — view agregada mês corrente UTC, limite fixo 6.
- `supabase/migrations/20260421070000_rpc_confirmar_pagamento_v3.sql` (novo) — evolui `confirmar_pagamento_v2` com `p_amount_cents` + `p_product_id`. Gate para Mentoria: se ≥6 pagas no mês, grava linha `status='failed'` + `metadata.reason='mes_esgotado'` e retorna `motivo='mentoria_mes_esgotado'` sem ativar tier. DROP explícito antes do CREATE (signature muda).
- `app/api/pagamento/webhook/route.ts` — passa `p_amount_cents` e `p_product_id` para RPC.
- `app/api/planos/vagas-mentoria/route.ts` (novo) — GET autenticado, no-store, lê da view.
- `components/planos/PlanosClient.tsx` — fetch vagas Mentoria no mount, badge "N/6 vagas" (vermelho ≤2) ou "ESGOTADO ESTE MÊS" (esgotado desabilita CTA).

**Nota §3.4:** Migrations ficam no repo, **NÃO aplicadas em prod** — Paulo roda no SQL Editor manualmente pela manhã.

**Build:** ✅
**Typecheck:** ✅ zero erros
**Lint:** ✅ zero errors (12 warnings pré-existentes ou triviais, não regressão)
**Secrets:** ✅ check-secrets limpo

Commit: wave 2 — tabela compras + vagas mentoria + gate mensal
