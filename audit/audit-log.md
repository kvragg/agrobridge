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

## [2026-04-21 02:10] Iteração 1 — Batch 3 (Wave 3)
**Ação:** LGPD — página /privacidade expandida + soft-delete + exportar + excluir (dupla confirmação).
**Arquivos:**
- `supabase/migrations/20260421080000_soft_delete_pii.sql` (novo) — adiciona `deleted_at` em processos/mensagens/checklist_itens/uploads + índices parciais + rewrite das 4 policies RLS para filtrar `deleted_at IS NULL`. Função `soft_delete_user_data(user_id)` SECURITY DEFINER marca cascata. Tabela `pedidos_exclusao_conta` com hash SHA-256 + TTL 30 min + RLS fechada.
- `app/privacidade/page.tsx` — seção 5 adiciona Cakto (faltava); seção 6 vira tabela operador×país×dados + Art. 33 incisos II/VIII; seção 8 adiciona autoatendimento (links para /conta/dados); data 21-abr-26.
- `app/api/conta/exportar/route.ts` (novo) — GET autenticado, rate 1/dia, retorna JSON com processos/mensagens/checklist/uploads(+signed URLs TTL 15min)/compras/auth metadata. Content-Disposition attachment. Audit 'conta_exportada'. Email confirmação fire-and-forget.
- `app/api/conta/excluir/route.ts` (novo) — POST dupla confirmação. Step 1 (body vazio): gera token 32B random, grava hash SHA-256 + IP + UA em `pedidos_exclusao_conta`, envia email, 202. Step 2 (body={token}): lookup restrito ao próprio user (defense-in-depth), valida expiração, chama RPC `soft_delete_user_data`, anonimiza `auth.users.email` → `deleted_<uuid>@agrobridge.invalid` + ban 100 anos, marca pedido confirmado, `signOut()`. Rate step1 3/h, step2 10/h por IP.
- `lib/audit.ts` — tipos `AuditEventType` incluem `conta_exportada`, `conta_exclusao_solicitada`, `conta_excluida`.
- `lib/email/resend.ts` — templates `enviarConfirmacaoExclusao` (com URL confirmação + aviso 30 min) e `enviarExportacaoPronta`.
- `app/conta/dados/page.tsx` + `components/conta/ContaDadosClient.tsx` (novos) — UI com 2 cards (exportar, excluir). Checkbox obrigatória antes do CTA de exclusão, alertas visuais.
- `app/conta/excluir/confirmar/page.tsx` + `components/conta/ConfirmarExclusaoClient.tsx` (novos) — consome `?t=<token>`, redireciona pra /login?next=... se não logado. Botão de confirmação manual (não auto-post — evita execução por prefetch/prewarm).

**Nota §3.4:** Migration 080000 adiciona DDL novo mas não DROP. Segue padrão aditivo.

**Build:** ✅ (4 novas rotas: /api/conta/excluir, /api/conta/exportar, /conta/dados, /conta/excluir/confirmar)
**Typecheck:** ✅
**Lint:** ✅ zero errors (11 warnings pré-existentes, não regressão)
**Secrets:** ✅

Commit: wave 3 — LGPD Art. 18 (privacidade + exportar + excluir soft-delete)

## [2026-04-21 02:35] Iteração 1 — Batch 4 (Wave 4 + Wave 5)
**Ação:** Logger estruturado JSON server-only + ponto único de captura de erros (plug Sentry futuro) + adapter Upstash Redis REST para rate limit distribuído.
**Arquivos:**
- `lib/logger.ts` (novo) — logger JSON uma-linha, 4 níveis (debug/info/warn/error), lista de `CAMPOS_PROIBIDOS` que auto-redacta PII (email, senha, nome, cpf, cnpj, token, etc). `capturarErroProducao(err, ctx)` — ponto único. TODO explícito pra plugar `Sentry.captureException` quando DSN definido.
- `lib/rate-limit-upstash.ts` (novo) — `rateLimitRemoto(chave, max, janelaMs)` async. Usa Upstash REST pipeline (INCR + PEXPIRE NX + PTTL) com timeout 1.5s + AbortSignal. Fallback auto para in-memory `rateLimit` se env vars ausentes ou request falhar. Zero SDK, fetch puro.
- `app/api/conta/exportar/route.ts` + `app/api/conta/excluir/route.ts` — migradas pra `rateLimitRemoto`. Rotas LGPD são as mais críticas p/ consistência multi-instância.

**Decisão de default:**
- **Sentry SDK não instalado** nesta sessão (revisado na pergunta #3 do questions-for-paulo). Decisão pragmática: adicionar bundle/config sem DSN útil é ruído. O `capturarErroProducao` é o ponto de plug — Paulo configura DSN e basta 1 PR de ~30 linhas pra ativar.
- **Upstash SDK não instalado** — REST API é fetch simples, 1 arquivo, sem deps novas. Env vars vazias = fallback in-memory (comportamento atual).

**Build:** ✅
**Typecheck:** ✅
**Lint:** ✅ 11 warnings pré-existentes, sem regressão
**Secrets:** ✅

Commit: wave 4+5 — logger estruturado + upstash rate-limit adapter
