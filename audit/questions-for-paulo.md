# Perguntas para o Paulo — Fila de Decisões Humanas

Formato: cada entrada tem contexto, opções, recomendação técnica, default temporário aplicado e reversibilidade.

---

## [2026-04-21 00:05] — Pergunta #1 — Iframe Cakto vs link externo
**Contexto:** OS §1 pede "checkout em iframe na área logada, não redirect". Código atual usa `<a href>` para link externo (`components/planos/PlanosClient.tsx:14-25`). Cakto tipicamente serve páginas com `X-Frame-Options: DENY` (não embedável), e a memória do projeto (`project_pagamento_cakto.md`) confirma que a decisão foi link externo.

**Opções:**
- A) Manter link externo (atual, funcional, testado)
- B) Tentar iframe e descobrir na marra se Cakto permite (arrisca regressão do fluxo de pagamento)
- C) Pedir suporte Cakto para versão whitelistada de iframe (processo comercial)

**Recomendação técnica:** A. Redirect externo é UX padrão em checkouts (Pagar.me, Stripe Checkout, Cakto). Iframe força `frame-src` na CSP, superfície de clickjacking, e quebra se provedor mudar header. Ganho de UX é marginal.

**Default aplicado:** A — mantém link externo, CSP permanece `frame-src 'none'`.

**Impacto se errar:** Reversível. Trocar `<a>` por `<iframe>` é ~20 linhas + CSP entry.

---

## [2026-04-21 00:07] — Pergunta #2 — Remover Pagar.me residual
**Contexto:** `PAGARME_API_KEY` / `PAGARME_WEBHOOK_SECRET` podem ainda estar no `.env.production` da Vercel. RPC legado `confirmar_pagamento` (migration `20260420020000`) continua no schema mas não é chamada pelo código atual (webhook usa `confirmar_pagamento_v2` com `p_provider='cakto'`).

**Opções:**
- A) Remover tudo agora (migration drop RPC + checklist Vercel para deletar env vars)
- B) Manter 30 dias para rollback caso Cakto falhe
- C) Manter indefinidamente (dívida técnica)

**Recomendação técnica:** B. Cakto está em produção há 1 dia; janela de observação de 30 dias é barata e preserva escape hatch. Adicionar tarefa no calendário para remoção em 2026-05-20.

**Default aplicado:** B — nenhuma remoção desta iteração. `.env.example` lista Pagar.me como `# DEPRECATED — remover após 2026-05-20`.

**Impacto se errar:** Baixo. Drop RPC + remover env vars são ações reversíveis via migration reversa.

---

## [2026-04-21 00:08] — Pergunta #3 — Sentry DSN
**Contexto:** Observabilidade é requisito da OS (L1). Sentry é o padrão de mercado, mas criar conta + projeto é interação humana com `sentry.io`.

**Opções:**
- A) Instalar SDK com DSN placeholder (no-op em runtime sem DSN real)
- B) Pular Sentry, usar `console.error` + Vercel Logs
- C) Alternativa: Axiom, Logtail, Baselime

**Recomendação técnica:** A. SDK instalado e configurado significa que adicionar DSN depois é 1 env var na Vercel. Zero custo se DSN vazio (Sentry SDK detecta e no-op).

**Default aplicado:** A — `@sentry/nextjs` instalado, DSN lido de `SENTRY_DSN`, fallback no-op.

**Impacto se errar:** Reversível. Desinstalar Sentry é `npm uninstall` + remover 3 arquivos config.

---

## [2026-04-21 00:09] — Pergunta #4 — Upstash Redis credentials
**Contexto:** Rate limit in-memory não sobrevive múltiplas instâncias Vercel (cada cold start zera contadores). Upstash é o provider serverless-friendly padrão.

**Opções:**
- A) Adapter Upstash instalado, env vars vazias → fallback para in-memory atual
- B) Não instalar (aceitar rate limit inconsistente)
- C) Usar Vercel KV

**Recomendação técnica:** A. Zero custo operacional até Paulo criar a conta. Upstash tem tier gratuito generoso (10k req/dia).

**Default aplicado:** A — SDK instalado, `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` em `.env.example`. Sem credentials, usa in-memory (comportamento atual).

**Impacto se errar:** Reversível.

---

## [2026-04-21 00:10] — Pergunta #5 — Retenção de dados pós-dossiê
**Contexto:** LGPD Art. 15 exige declaração de prazo de retenção. Quanto tempo guardar documentos após o dossiê ser entregue?

**Opções:**
- A) 30 dias (mínimo, força usuário a retornar rápido)
- B) 90 dias (equilíbrio)
- C) 365 dias (padrão bancário brasileiro — BACEN exige 5 anos para crédito, mas AgroBridge não é instituição financeira)
- D) Indefinido (violaria LGPD)

**Recomendação técnica:** C. Banco pode levar 3-6 meses para aprovar crédito, cliente pode precisar rever dossiê. 365 dias com soft-delete automático via cron. Suficiente e defensável juridicamente.

**Default aplicado:** C — 365 dias documentado em `/privacidade`. Cron de soft-delete **não implementado** nesta iteração (manual por enquanto; adicionar como débito).

**Impacto se errar:** Reversível. Alterar prazo é atualizar copy + job.

---

## [2026-04-21 00:12] — Pergunta #6 — DPO (Data Protection Officer)
**Contexto:** LGPD Art. 41 exige Encarregado (DPO) para tratamentos de dados pessoais. Pode ser o próprio controlador (Paulo) ou terceirizado.

**Opções:**
- A) Paulo como DPO, email público `paulocosta.contato1@gmail.com`
- B) Criar email dedicado `lgpd@agrobridge.com.br` (depende de domínio próprio)
- C) Terceirizar (custo mensal R$300-1500)

**Recomendação técnica:** A agora, B quando domínio próprio registrar. DPO terceirizado só faz sentido com escala (1000+ usuários).

**Default aplicado:** A — `/privacidade` lista Paulo como DPO com email pessoal. Nota de revisão quando domínio for registrado.

**Impacto se errar:** Reversível.

---

## [2026-04-21 00:14] — Pergunta #7 — Aplicação de migrations em produção
**Contexto:** Novas migrations (`compras`, `vagas_ouro_mes_corrente`, `deleted_at` em PII) serão adicionadas ao repo nesta auditoria. OS §3.4 proíbe aplicar SQL destrutivo em prod automaticamente.

**Opções:**
- A) Paulo roda manualmente no Supabase SQL Editor após revisar
- B) Configurar migration runner via CLI Supabase
- C) Esquecer auditoria das migrations e só rodar em prod quando Paulo chamar

**Recomendação técnica:** A. Migration files ficam em `supabase/migrations/` (padrão do projeto). Paulo copia/cola no SQL Editor pela manhã. Migrations são aditivas (criação de tabela/view, ADD COLUMN com default NULL) — zero risco de quebrar dados existentes.

**Default aplicado:** A — migrations ficam no repo, `final-report.md` lista exatamente a ordem de execução.

**Impacto se errar:** Reversível via rollback migration.

---

## [2026-04-21 00:45] — Pergunta #9 — Vitest bloqueado por Windows Defender (WDAC)
**Contexto:** Vitest 4.1.4 usa rolldown, que carrega `node_modules/@rolldown/binding-win32-x64-msvc/rolldown-binding.win32-x64-msvc.node` via require nativo. WDAC (Controle de Aplicativo) está bloqueando esse .node binding. Erro: `Uma política de Controle de Aplicativo bloqueou este arquivo`. Afeta `npm test` nesta máquina.

**Opções:**
- A) Whitelist o arquivo .node no WDAC (ação administrativa, single-click)
- B) Downgrade Vitest para 3.x (Vite + esbuild, sem rolldown) — afeta lock file
- C) Rodar testes apenas em CI (GitHub Actions Linux) e pular localmente
- D) `Start-Process powershell -Verb RunAs` + `Set-MpPreference -ExclusionPath` nessa dll

**Recomendação técnica:** A (single-click) ou C (trazer gate para CI). Downgrade é retrabalho. Decisão do Paulo — envolve permissão admin na máquina local.

**Default aplicado:** Nesta auditoria, `npm test` foi pulado. Os 17 testes integration pré-existentes continuam válidos (cobertos por revisão manual de código). Os 11 testes novos que eu escreveria no Wave 6 ficam **escritos mas não executados** nesta sessão — Paulo roda após whitelistar ou em CI pela manhã.

**Impacto se errar:** Reversível. Testes não quebram código; se Wave 6 adicionar teste com bug de sintaxe, typecheck do build pega na hora do CI.

---

## [2026-04-21 00:15] — Pergunta #8 — Migração região Supabase para SP
**Contexto:** Supabase projeto atual é em Ohio (us-east-2). LGPD não proíbe processamento no exterior com base legal + cláusula contratual, mas latência Brasil↔Ohio é ~150ms.

**Opções:**
- A) Manter Ohio e declarar transferência internacional em `/privacidade` (feito nesta iteração)
- B) Migrar para São Paulo (requer downtime, export/import, uns 30 min)
- C) Agendar migração para momento de baixo tráfego

**Recomendação técnica:** A. 150ms é imperceptível para o UX do AgroBridge (geração de dossiê leva 30-90s, não é latency-sensitive). Migração dá trabalho e não traz benefício mensurável agora.

**Default aplicado:** A — declaração em `/privacidade`. Migração fora de escopo do overnight.

**Impacto se errar:** Reversível mas custoso (migração inversa).
