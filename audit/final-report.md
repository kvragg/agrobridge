# Auditoria Brutal Noturna — AgroBridge
## Relatório Final — Iteração 1 · 2026-04-21

**Branch:** `audit-2026-04-20`
**Base:** `main @ 440250b`
**Commits nesta iteração:** 7 (setup + 6 waves)
**Duração:** ~3h30 (00:00 → 03:30)
**Critério de parada acionado:** §3.1 — critérios de sucesso atingidos (zero 🔴 crítico remanescente).

---

## TL;DR

Zero 🔴 crítico, zero 🔴 alto. 3 🟡 médios deixados como dívida documentada. 4 migrations SQL prontas para Paulo rodar manualmente no SQL Editor (ordem cronológica). Zero ação em produção — commits ficam na branch, push sem PR, merge é decisão humana.

**Prontidão para escala:** ✅ APTO (após aplicar as 4 migrations).

---

## O que foi entregue

### Wave 1 — Segurança estrutural
- `lib/safe-redirect.ts` — helper `sanitizarCaminhoInterno()` bloqueia open redirect, CRLF injection, protocol-relative, javascript:/data:
- `app/auth/callback/route.ts` + `app/(auth)/login/page.tsx` passam pelo helper
- `proxy.ts` — `/planos` e `/conta` em `ROTAS_PROTEGIDAS_WEB`, `Cache-Control: no-cache, must-revalidate, private` + `Pragma: no-cache` para rotas autenticadas
- `scripts/check-secrets.sh` — grep pré-commit para sk-ant, service role JWT, Cakto secret, AWS keys, Resend keys, conn strings, PEM. Rodado em todos os commits desta auditoria.

### Wave 2 — Tabela compras + gate mensal Mentoria
- Migration `20260421050000_compras_table.sql` — tabela `compras` com RLS owner-select, UNIQUE (provider, tx_id), trigger updated_at, CHECKs em status/provider, bloqueio total de INSERT/UPDATE/DELETE mesmo para service_role (tudo via RPC)
- Migration `20260421060000_vagas_mentoria_view.sql` — view agregada mês corrente UTC com limite fixo 6
- Migration `20260421070000_rpc_confirmar_pagamento_v3.sql` — evolui `v2` com `p_amount_cents` + `p_product_id`. Gate: se ≥6 Mentorias pagas no mês, grava linha `status='failed'` + `metadata.reason='mes_esgotado'`, retorna motivo sem ativar tier
- `app/api/pagamento/webhook/route.ts` — passa os novos parâmetros
- `app/api/planos/vagas-mentoria/route.ts` (novo) — GET autenticado, no-store
- `components/planos/PlanosClient.tsx` — badge "N/6 vagas" (vermelho ≤2) ou "ESGOTADO ESTE MÊS" (desabilita CTA)

### Wave 3 — LGPD Art. 18
- Migration `20260421080000_soft_delete_pii.sql` — `deleted_at` em processos/mensagens/checklist_itens/uploads + índices parciais + rewrite das 4 RLS policies. Função `soft_delete_user_data(UUID)` SECURITY DEFINER. Tabela `pedidos_exclusao_conta` com hash SHA-256 + TTL 30 min + RLS totalmente fechada.
- `app/privacidade/page.tsx` — seção 5 com Cakto, seção 6 tabela operador×país×dados + Art. 33, seção 8 autoatendimento
- `app/api/conta/exportar/route.ts` — GET autenticado, rate 1/dia, retorna JSON com processos/mensagens/checklist/uploads (signed URLs TTL 15min) / compras / auth metadata. Audit `conta_exportada`.
- `app/api/conta/excluir/route.ts` — POST dupla confirmação. Step 1: token 32B random + hash SHA-256 + email. Step 2: valida token, soft-delete, anonimiza email + ban 100 anos, signOut.
- `app/conta/dados/page.tsx` + `app/conta/excluir/confirmar/page.tsx` — UI completa com checkbox obrigatória e botão manual (evita execução em prefetch)

### Wave 4 — Observabilidade
- `lib/logger.ts` — logger JSON uma-linha, 4 níveis, auto-redação de PII em `CAMPOS_PROIBIDOS` (email/senha/nome/cpf/cnpj/token/api_key), truncamento em >1000 chars
- `capturarErroProducao(err, ctx)` — ponto único. TODO explícito pra plugar `Sentry.captureException` quando DSN disponível. **Decisão:** não instalar `@sentry/nextjs` sem DSN útil (bundle inchado sem valor).

### Wave 5 — Rate limit distribuído
- `lib/rate-limit-upstash.ts` — `rateLimitRemoto(chave, max, janelaMs)` async, pipeline Upstash REST (INCR + PEXPIRE NX + PTTL) com timeout 1.5s + AbortSignal. Fallback auto para in-memory se env vars ausentes ou fetch falhar. Zero SDK — fetch puro.
- Rotas LGPD migradas. Demais rotas continuam in-memory (risco baixo).

### Wave 6 — Testes + auditoria UI
- `tests/integration/safe-redirect.test.ts` — 7 casos de open-redirect
- `tests/integration/logger-redact.test.ts` — 5 casos de redação/truncamento/estrutura JSON
- `tests/integration/rate-limit-upstash.test.ts` — 4 casos incluindo fallback em falha de rede
- `app/robots.ts` — disallow /api, /dashboard, /entrevista, /checklist/, /planos, /conta
- `app/sitemap.ts` — só rotas verdadeiramente públicas
- UI scan: `<html lang="pt-BR">` ✅, zero `<img>` sem alt ✅, zero botão icon-only sem aria-label ✅

### Wave 7 — DX/docs
- `.env.example` (commitado via exceção no .gitignore) — todas env vars atuais
- `CLAUDE.md` — mapa real de arquitetura (8 módulos, 8 convenções, limites absolutos, comandos, arquivos de topo)
- `README.md` — setup reprodutível em 5 passos, árvore de arquitetura, fluxo do produto

---

## 🔴 Crítico

**Nenhum remanescente.**

---

## 🟠 Alto

**Nenhum remanescente.**

---

## 🟡 Médio (dívida documentada)

1. **Testes de integração não executados nesta sessão**
   - Causa: WDAC (Windows Defender) bloqueia `rolldown-binding.win32-x64-msvc.node` — ambiente local do Paulo, não bug no código.
   - Mitigação: typecheck passa em todos os testes novos. Testes rodarão em CI ou após whitelist manual do binding.
   - Ação humana: adicionar exceção WDAC ou rodar em CI antes do próximo merge.

2. **Sentry não plugado**
   - Decisão pragmática: `capturarErroProducao` é o ponto único. Ativar = 1 PR de ~30 linhas + DSN.
   - Ação humana: criar conta Sentry (ou equivalente — Axiom/Logtail) e configurar `SENTRY_DSN`.

3. **Upstash sem credenciais**
   - Rate limit remoto cai para in-memory sem env vars. Multi-instância Vercel fica inconsistente.
   - Ação humana: criar Redis no Upstash (free tier) e preencher `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` na Vercel.

---

## 🧨 Migrations para Paulo rodar manualmente

**Ordem estrita. NÃO rodou nada em produção — tudo apenas commitado.**

```sql
-- SQL Editor Supabase, na ordem:
-- 1. supabase/migrations/20260421050000_compras_table.sql
-- 2. supabase/migrations/20260421060000_vagas_mentoria_view.sql
-- 3. supabase/migrations/20260421070000_rpc_confirmar_pagamento_v3.sql
-- 4. supabase/migrations/20260421080000_soft_delete_pii.sql
```

Cada arquivo é auto-contido, idempotente (`IF NOT EXISTS`, `CREATE OR REPLACE`), sem DROP destrutivo. Rodar uma de cada vez; se falhar, mandar mensagem de erro.

**Depois de 080000**, a aplicação já vai conseguir ler `/api/conta/exportar` e `/api/conta/excluir` corretamente — antes disso, as rotas tentam chamar RPC/tabela que não existem no schema.

---

## 🟢 Fluxos validados (verdes antes da push)

- `npm run build` ✅ todas waves
- `npx tsc --noEmit` ✅ todas waves
- `npm run lint` ✅ zero errors, 11 warnings pré-existentes (sem regressão)
- `bash scripts/check-secrets.sh` ✅ em todos os commits
- Rotas novas no build: `/api/conta/excluir`, `/api/conta/exportar`, `/api/planos/vagas-mentoria`, `/conta/dados`, `/conta/excluir/confirmar`, `/robots.txt`, `/sitemap.xml`

---

## 📋 Smoke manual para Paulo

Depois de rodar as 4 migrations:

```bash
# Local
npm install     # caso haja mudança em package-lock (não houve)
npm run dev

# Smoke em http://localhost:3000:
# 1. /planos (logado com processo ativo) — cards renderizam, badge Mentoria "6/6 vagas"
# 2. /conta/dados (logado) — 2 cards (exportar + excluir)
# 3. Exportar → baixa JSON com processos/mensagens/checklist/uploads/compras
# 4. Excluir step 1 → checkbox obrigatória, POST retorna 202, email chega
# 5. /privacidade — seção "Transferências Internacionais" visível
# 6. /robots.txt — disallow rotas autenticadas
# 7. /sitemap.xml — só rotas públicas
```

Em Vercel Preview (branch `audit-2026-04-20`): mesmos 7 passos.

---

## Limites respeitados (§3.4)

- [x] Zero `git push` em `main`
- [x] Zero `vercel --prod`
- [x] Zero SQL executado em produção (só migrations no repo)
- [x] Zero secret commitado (check-secrets passou em todos os commits)
- [x] Zero toque em `.env.local` / `.env.production` / Vercel env vars
- [x] Commits atômicos em branch dedicada
- [x] Decisões de negócio registradas em `audit/questions-for-paulo.md`

---

## O que NÃO foi feito (por design, fora de escopo ou §3.4)

- Iframe Cakto (questão #1 — default A: link externo mantido)
- Remoção de Pagar.me residual (questão #2 — janela de 30 dias)
- Instalação `@sentry/nextjs` (questão #3 revisada — ponto de plug pronto)
- Migração região Supabase para SP (fora de escopo — requer downtime)
- `iframe` → CSP `frame-src` (não justificável enquanto Cakto for link externo)
- Install Supabase MCP (pendente pós-Cakto, memória separada)

---

## Próximos passos recomendados (ordem de prioridade)

1. **Paulo roda as 4 migrations** no SQL Editor
2. **Paulo revisa Vercel preview** da branch `audit-2026-04-20`
3. **Paulo decide merge** de `audit-2026-04-20` → `main` (PR manual)
4. **Ativar Upstash** (free tier, 5 min setup) — elimina inconsistência multi-instância
5. **Ativar Sentry** (ou alternativa) — substitui `console.error` + Vercel Logs
6. **Rodar testes em CI** ou whitelist WDAC local
7. **Em 2026-05-20**: remover Pagar.me residual (questão #2)

---

**Fim da iteração 1.** Pronto para escala após as 4 migrations + ativação de Upstash.
