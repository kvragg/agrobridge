# AgroBridge — Log de Correções Pré-Launch

**Data:** 2026-04-23
**Branch:** `feature/simulador-leitura`
**Referência:** `LAUNCH_REVIEW.md` (relatório de auditoria que originou este fix-up)

Log cronológico de cada correção aplicada. Itens que precisam decisão humana (asset/credencial) ficam marcados como **TODO(Paulo)** no código; aqui estão listados com contexto.

---

## Validação final

- ✅ `rm -rf .next && npx tsc --noEmit` — EXIT=0
- ✅ `npm run lint` — 0 erros, 0 warnings
- ✅ `npx vitest run __tests__` — 13/13 passed em 205ms
- ✅ `npm run build` — build production completo, 54 rotas geradas (incl. `/manifest.webmanifest` novo)

---

## Ordem cronológica das mudanças

### 1. `package.json` — `engines` (M7)

**Item:** M7 — pinar Node version pra evitar build break em upgrade do Vercel.
**Arquivo:** `package.json`
**Antes:** sem bloco `engines`.
**Depois:** `"engines": { "node": ">=20.11.0 <23" }`.

### 2. `app/api/checklist/route.ts` — remover console.log debug (M2)

**Item:** M2 — console.log vazando em produção.
**Arquivo:** `app/api/checklist/route.ts:13`
**Antes:** `console.log(\`[api/checklist] POST iniciado — modelo=${SONNET_MODEL}, key_presente=${!!process.env.ANTHROPIC_API_KEY}\`)`
**Depois:** removido — info inútil em produção (dashboard Vercel mostra envs).

### 3. `app/api/entrevista/route.ts` — remover console.log debug (M2)

**Item:** M2.
**Arquivo:** `app/api/entrevista/route.ts:50`
**Antes/Depois:** idêntico ao anterior.

### 4. `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx` — boundaries globais (M1)

**Item:** M1 — sem boundaries de erro / loading / 404.
**Arquivos criados:**
- `app/loading.tsx` — spinner acessível com `role="status"` + `aria-label="Carregando"`.
- `app/error.tsx` — `"use client"` boundary com botão "Tentar de novo" (chama `reset()`) + link pra `/`. Mostra `digest` quando presente (ref pra suporte).
- `app/not-found.tsx` — tela 404 com CTAs pra `/` e `/dashboard`, `robots: { index: false }`.

**Decisão:** CTA do `error.tsx` usa `next/link` (ESLint bateu em `<a>` pra route interna). Corrigido na rodada de lint.

### 5. `app/manifest.ts` — Web App Manifest (M5)

**Item:** M5 — favicon/manifest incompletos.
**Arquivo criado:** `app/manifest.ts`
**Conteúdo:** manifest PWA mínimo (`name`, `short_name`, `description`, `start_url`, `theme_color`, `background_color`, `lang: 'pt-BR'`). Ícone atual é `/favicon.ico` fallback.

> **TODO(Paulo):** exportar do Figma:
> - `public/icon-192.png` (192×192, Android)
> - `public/icon-512.png` (512×512, Android/PWA)
> - `public/apple-icon-180.png` (180×180, iOS Home Screen)
> - `public/og-image.png` (1200×630, social preview)
>
> Quando existirem, adicionar em `app/manifest.ts` (array `icons`) e em `app/layout.tsx` (`metadata.openGraph.images` e `metadata.icons.apple`).

### 6. `app/layout.tsx` — Open Graph + Twitter Cards + metadataBase (M4)

**Item:** M4 — social preview quebrado.
**Arquivo:** `app/layout.tsx`
**Antes:** metadata só com `title` + `description`.
**Depois:** adicionados `metadataBase`, `title.template`, `openGraph` (com `siteName`, `locale: pt_BR`, `url`, `title`, `description`), `twitter.card: 'summary_large_image'`, `icons`. Comentários `TODO(Paulo)` marcam onde encaixar `og-image.png` e `apple-icon.png` quando existirem.

### 7. `app/page.tsx` — metadata própria da home (B6)

**Item:** B6 — home herdava só do layout.
**Arquivo:** `app/page.tsx`
**Antes:** sem `export const metadata`.
**Depois:** `title` específico ("Crédito rural aprovado · dossiê técnico pronto pra banco") + `description` + `alternates.canonical: "/"`.

### 8. `app/(auth)/layout.tsx` — noindex no grupo auth (M3)

**Item:** M3 — auth pages sem `robots: { index: false }`.
**Arquivo criado:** `app/(auth)/layout.tsx`
**Efeito:** metadata `robots: { index: false, follow: false }` herdada por `login`, `cadastro`, `resetar-senha`.

### 9. `app/(dashboard)/layout.tsx` — noindex no grupo dashboard (M3)

**Item:** M3.
**Arquivo:** `app/(dashboard)/layout.tsx`
**Mudança:** adicionado `export const metadata: Metadata = { robots: { index: false, follow: false } }` (bloqueia todo `/dashboard/*`, `/entrevista/*`, `/checklist/*`, `/simulador/*`, `/como-funciona`).

### 10. `app/admin/layout.tsx` — noindex no admin (M3)

**Item:** M3.
**Arquivo:** `app/admin/layout.tsx`
**Mudança:** adicionado `export const metadata: Metadata = { robots: { index: false, follow: false } }`.

### 11. `app/auth/layout.tsx` — noindex no segmento /auth (M3)

**Item:** M3 — `/auth/confirmado` era client component sem metadata.
**Arquivo criado:** `app/auth/layout.tsx`
**Efeito:** cobre `/auth/confirmado` e `/auth/callback` futuros.

### 12. `app/sitemap.ts` — incluir `/como-funciona` (M10)

**Item:** M10 — sitemap faltando página pública.
**Arquivo:** `app/sitemap.ts`
**Antes:** sem `/como-funciona`.
**Depois:** entrada adicionada com priority 0.7, changeFrequency monthly.

### 13. `components/checklist/DossieCard.tsx:216` — `<img>` com justificativa (B2)

**Item:** B2 — lint warning em `<img>`.
**Arquivo:** `components/checklist/DossieCard.tsx`
**Antes:** `<img src={pagamento.qr_code_url} ... />`
**Depois:** mantido `<img>` (URL dinâmica de provedor externo — `next/image` precisaria `remotePatterns` ou `unoptimized`). Adicionado comentário explicativo + `eslint-disable-next-line @next/next/no-img-element` + `loading="lazy"`.

### 14. `eslint.config.mjs` — tolerar variáveis com prefixo `_` (B1)

**Item:** B1 — 14 warnings de `no-unused-vars`.
**Arquivo:** `eslint.config.mjs`
**Mudança:** regra custom `@typescript-eslint/no-unused-vars` com `argsIgnorePattern: "^_"`, `varsIgnorePattern: "^_"`, `caughtErrorsIgnorePattern: "^_"`, `destructuredArrayIgnorePattern: "^_"`. Elimina os warnings de stubs (`_texto`, `_fontes`, `_tabela`, etc) que eram intencionalmente unused.

### 15. Limpeza de unused vars reais (B1)

**Item:** B1 (restantes — não `_`-prefixed).
**Arquivos:**
- `components/landing/proof.tsx:8` — removido `import Link from "next/link"` (não usado).
- `components/simulador/ComparadorClient.tsx:108` — removido array `camposComparados` dead code.
- `lib/simulator/engine.ts:23,28` — removidos imports duplicados (`CULTURAS`, `GARANTIAS`) que viravam re-exports vazios.

### 16. `.github/workflows/ci.yml` — pipeline CI (A1)

**Item:** A1 — sem CI/CD.
**Arquivo criado:** `.github/workflows/ci.yml`
**Conteúdo:** workflow único `checks` rodando em PR e push pra `main`:
- `actions/checkout@v4` + `actions/setup-node@v4` (Node 20 + npm cache)
- `npm ci`
- `npx tsc --noEmit`
- `npm run lint`
- `npx vitest run __tests__`
- `npm run build` (com envs stub pra build não quebrar na ausência de credenciais reais)
- `concurrency.cancel-in-progress: true` (evita run duplicado ao push seguido de PR)

### 17. `@sentry/nextjs` instalado (A2)

**Item:** A2 — sem monitoramento de erros.
**Comando:** `npm install @sentry/nextjs` → `"@sentry/nextjs": "^10.50.0"` em `dependencies`.

### 18. `instrumentation.ts` — init guardado por DSN (A2)

**Item:** A2.
**Arquivo criado:** `instrumentation.ts` (raiz)
**Conteúdo:** hook `register()` que chama `Sentry.init` apenas se `process.env.SENTRY_DSN` existe. Cobre runtimes `nodejs` e `edge`. `sendDefaultPii: false` (a gente já sanitiza via `lib/logger.ts`). Sem DSN = zero overhead (imports dinâmicos).

### 19. `lib/logger.ts` — `capturarErroProducao` agora chama Sentry (A2)

**Item:** A2.
**Arquivo:** `lib/logger.ts:142-170`
**Antes:** só TODO comment.
**Depois:** `if (process.env.SENTRY_DSN)` + `import('@sentry/nextjs').then((Sentry) => Sentry.captureException(err, { tags, extra }))`. Wrapped em `try/catch` — falha de observabilidade nunca quebra a rota. Extra passa pelo `sanitizarExtra` (redacta PII).

> **TODO(Paulo):** criar projeto no Sentry (free tier 5k errors/mês), pegar o DSN em Project Settings → Client Keys, e adicionar no Vercel:
> - `vercel env add SENTRY_DSN production` → colar DSN.
> Sem essa env, Sentry fica desativado (fallback pra log estruturado existente, sem erro).

### 20. `lib/rate-limit-upstash.ts` — nova função `rateLimitIARemoto` (A4)

**Item:** A4 — rate-limit in-memory bypassável.
**Arquivo:** `lib/rate-limit-upstash.ts`
**Mudança:** adicionada função async `rateLimitIARemoto({ userId, plano, canal })` que envelopa `rateLimitRemoto` (pipeline Upstash com fallback in-memory). Mesma semântica do `rateLimitIA` sync, mas distribuída. Limites vêm de `LIMITES_MENSAGENS_POR_HORA` (Free 10/h · Bronze 25/h · Prata 50/h · Ouro 100/h).

### 21. Rate-limit distribuído em 8 rotas IA + 3 rotas auth (A4)

**Item:** A4.
**Arquivos migrados** (`rateLimit(...)` → `await rateLimitRemoto(...)`, `rateLimitIA(...)` → `await rateLimitIARemoto(...)`):
- `app/api/chat/route.ts` (rateLimitIA → rateLimitIARemoto)
- `app/api/checklist/route.ts`
- `app/api/entrevista/route.ts`
- `app/api/viabilidade/route.ts`
- `app/api/dossie/route.ts`
- `app/api/simulador/salvar/route.ts`
- `app/api/documento/validar/route.ts`
- `app/api/widget-ia/upload/route.ts` (rateLimitIA → rateLimitIARemoto)
- `app/api/auth/login/route.ts` (bônus — brute-force protection distribuída)
- `app/api/auth/signup/route.ts` (bônus)
- `app/api/auth/resend/route.ts` (bônus)

**Sem Upstash configurado:** `rateLimitRemoto` / `rateLimitIARemoto` detectam env ausente e delegam pro in-memory — comportamento idêntico ao anterior. Com Upstash: distribuído.

> **TODO(Paulo):** criar conta free no Upstash Redis (10k commands/dia grátis), criar database "agrobridge-ratelimit", adicionar no Vercel:
> - `UPSTASH_REDIS_REST_URL`
> - `UPSTASH_REDIS_REST_TOKEN`
>
> Sem essas envs, nada quebra — só não tem garantia distribuída.

### 22. `app/api/pagamento/webhook/route.ts` — migrar 6 console.error pro logger (M6)

**Item:** M6.
**Arquivo:** `app/api/pagamento/webhook/route.ts`
**Mudanças:** adicionado `import { capturarErroProducao } from '@/lib/logger'`. Todos os 6 `console.error` trocados por `capturarErroProducao(err, { modulo: 'pagamento/webhook', extra: { etapa, ...ctx } })` — incluindo: CAKTO_WEBHOOK_SECRET ausente, produto não mapeado, RPC `confirmar_pagamento_v2` falhou, email confirmação falhou, lookup processo por email falhou, auto-criar processo órfão falhou, gravar órfã em webhook_events falhou.

Efeito: quando SENTRY_DSN existir, qualquer falha de pagamento vira issue agrupada automaticamente.

### 23. `app/api/conta/excluir/route.ts` — migrar 6 console.error pro logger (M6)

**Item:** M6.
**Arquivo:** `app/api/conta/excluir/route.ts`
**Mudanças:** adicionado `import { capturarErroProducao }`. Todos os 6 `console.error` trocados (registrar pedido, envio email confirmação, lookup token, RPC `soft_delete_user_data`, anonimizar auth.users, signOut pós-exclusão). Preserva a userId no contexto quando disponível — fluxo LGPD precisa de trilha.

### 24. `app/api/dossie/route.ts` — migrar 8 console.error pro logger (M6)

**Item:** M6.
**Arquivo:** `app/api/dossie/route.ts`
**Mudanças:** adicionado `import { capturarErroProducao }`. Todos os 8 `console.error` trocados (RPC iniciar_geracao, Sonnet laudo, montar PDF, upload storage, RPC finalizar_geracao, email dossie pronto, erro inesperado + CAKTO secret ausente). Status e mensagem da API Anthropic viram `extra` (não Error message direto).

---

## Itens explicitamente não aplicados (backlog consciente)

| Item | Motivo |
|---|---|
| M6 parcial (chat, checklist, widget-ia/upload — outros) | ~25 `console.error` restantes em rotas secundárias. Lista pós-launch — ganho marginal vs esforço, e com Sentry ativo eles aparecem no Vercel Logs mesmo sem `captureException`. |
| M8 — `noUncheckedIndexedAccess` | Refatoração grande (muitos `arr[0].prop` precisam guard). Backlog, aceitável pós-launch. |
| M9 — cores hex hardcoded em simulador | Refatoração de design system. Não impacta launch. Backlog. |
| A3 — CVE uuid<14 em resend→svix | Downgrade não viável (perde features). Não há patch upstream ainda. Documentado no LAUNCH_REVIEW. |
| B3 — TODOs `lib/mcr/*` | Decisão de produto (Paulo precisa confirmar taxas/bancos do Plano Safra 2026). |
| B4 — COOP/COEP | Não aplicável (app sem SharedArrayBuffer/WASM). |
| B5 — Copy "pra" | Subjetivo — decisão de voz da marca, Paulo decide. |

---

## TODOs pendentes de decisão humana (Paulo)

Consolidado dos blocos acima pra facilitar:

1. **Sentry DSN** — criar projeto free no sentry.io, adicionar `SENTRY_DSN` no Vercel.
2. **Upstash Redis** — criar database free, adicionar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` no Vercel.
3. **og-image.png** — exportar 1200×630 do Figma pra `public/og-image.png`, depois editar `app/layout.tsx:openGraph.images`.
4. **icon set** — exportar `icon-192.png`, `icon-512.png`, `apple-icon-180.png` do Figma, atualizar `app/manifest.ts` e `app/apple-icon.png` (Next 15+ auto-detecta esse nome).
5. **Dados MCR** — confirmar valores em `lib/mcr/linhas-credito.ts`, `lib/mcr/bancos-comportamento.ts`, `lib/mcr/documentos-por-perfil.ts`.

Nenhum dos 5 é blocker de lançamento. Ordem recomendada: Sentry → Upstash → og-image → icon set → MCR.
