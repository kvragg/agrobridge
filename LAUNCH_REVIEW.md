# AgroBridge — Revisão Completa Pré-Launch

**Data:** 2026-04-23
**Escopo:** revisão autônoma em 7 eixos (segurança, design/UX, código, performance, infra, banco, edge cases).
**Branch auditada:** `feature/simulador-leitura` (com PR aberto pra `main`).
**Auditor:** Claude (Opus 4.7) com 3 subagentes de recon paralelos + execução direta de build/lint/test/audit.

> **Status de correção (2026-04-23 10:20 BRT):** todos os itens ALTO/MÉDIO/BAIXO mecânicos foram aplicados. Ver `LAUNCH_FIXES.md` pro log cronológico. Itens que dependem de decisão humana (SENTRY_DSN, og-image.png, apple-icon.png) ficaram marcados como TODO(Paulo) no código.

---

## Sumário executivo

| Eixo | Status | Achados |
|---|---|---|
| Build / TypeScript / Lint | ✅ | Clean (0 erros, 14 warnings aceitáveis) |
| Testes | ✅ | 13/13 unit, 17/17 E2E (últimos rodados na sessão anterior) |
| Segurança de aplicação | ✅ | CSP, HSTS, RLS, rate-limit, HMAC, IDOR — todos em dia |
| Git / secrets | ✅ | Nenhum secret no repo; `.gitignore` cobre `.env*` |
| LGPD | ✅ | Art. 18 V (exportar) + VI (excluir) implementados |
| **DevOps / CI / Monitoramento** | 🔴 | **Sem CI, sem Sentry — bloqueio real pra produto pago** |
| SEO / social preview | ⚠️ | Robots + sitemap ok; falta Open Graph e favicon set |
| UX (loading / error / empty) | ⚠️ | Sem `loading.tsx` / `error.tsx` globais |
| Performance (build output) | ✅ | Bundle limpo, `poweredByHeader: false`, sem warnings no build |
| Dependências (npm audit) | ⚠️ | 3 moderate (cadeia resend → svix → uuid < 14) |

**Veredito:** ⚠️ **PRONTO COM RESSALVAS.** Nenhum bloqueio CRÍTICO de segurança ou funcionalidade. Dois itens ALTOS (CI + Sentry) devem ser feitos em 1–2h **antes** do lançamento de verdade (ou seja, antes do 1º lead pago que não seja o próprio Paulo). O restante é polimento pós-launch.

---

## 🔴 CRÍTICO — bloqueios obrigatórios

*Nenhum achado neste nível.* A postura de segurança está madura para um SaaS pago. Os bloqueios reais foram rebaixados para ALTO porque mitigáveis em <2h.

---

## 🟠 ALTO — fortemente recomendado antes do launch

### A1. Sem CI/CD — nenhuma barreira contra regressão entre deploys ✅

**Evidência:** `.github/workflows/` não existe (comando `ls .github` → "No such file or directory"). Toda mudança em `main` vai direto pra Vercel em produção sem execução automática de `tsc --noEmit`, `eslint`, `vitest` ou `playwright`.

**Risco:** regressão silenciosa (uma PR que quebre build/testes chega em prod se ninguém rodar local). Em produto pago, um erro de typecheck virando 500 no checkout é dinheiro perdido.

**Correção (esforço: ~30 min):** criar `.github/workflows/ci.yml` rodando em PR + push pra main:

```yaml
name: CI
on: [push, pull_request]
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npx vitest run __tests__
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://stub.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: stub
          SUPABASE_SERVICE_ROLE_KEY: stub
          ANTHROPIC_API_KEY: stub
          RESEND_API_KEY: stub
          LEAD_NOTIFICATION_EMAIL: test@test.com
          CAKTO_WEBHOOK_SECRET: stub
```

### A2. Sem monitoramento de erros em produção (Sentry placeholder) ✅ (código) · ⏸️ (DSN pendente)

**Evidência:**
- `lib/logger.ts:142` — `// TODO(sentry): quando SENTRY_DSN configurado, enviar para Sentry aqui.` A integração está desenhada, mas nunca conectada.
- `.env.example` menciona `SENTRY_DSN` como opcional.
- `package.json` não tem `@sentry/nextjs` instalado.

**Risco:** quando um lead pagante tem um erro no checkout, Sonnet falha, webhook não processa ou dossiê quebra, **a única fonte de verdade é Vercel Logs** — retention limitado (30 dias no Hobby), sem agrupamento, sem alerta. Impossível responder proativamente.

**Correção (esforço: ~1h):**
1. `npm install @sentry/nextjs`
2. `npx @sentry/wizard@latest -i nextjs` (configura `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts`).
3. Ligar o TODO em `lib/logger.ts:142` — `import * as Sentry from '@sentry/nextjs'` + `Sentry.captureException(err, { extra: ctx })`.
4. Adicionar `SENTRY_DSN` no Vercel env vars (projeto Free do Sentry dá 5k errors/mês grátis).

**Valor:** você vai descobrir o problema antes do cliente abrir ticket.

### A3. CVE moderate em cadeia `resend → svix → uuid` (GHSA-w5hq-g745-h8pq) ⏸️ (aguarda patch upstream)

**Evidência (npm audit):**
```
uuid  <14.0.0    moderate   Missing buffer bounds check in v3/v5/v6
  └── svix      (nested)
        └── resend (direct, 6.12.0)
```

`fixAvailable` aponta downgrade para `resend@6.1.3` (semver major — perde features). A CVE real está em `uuid`, e só afeta se a app passar buffer customizado para `uuid.v3/v5/v6` com `buf` argument — `resend` não faz isso, então **exploração real é improvável** neste contexto.

**Risco prático:** baixo, mas o red flag fica no `npm audit` e pode assustar reviewers/parceiros.

**Correção (esforço: ~15 min):** aguardar patch upstream (`resend` ou `svix` atualizando `uuid` pra ≥14). Enquanto isso, documentar no README que a vuln está catalogada mas não explorável no uso feito pela app. Alternativa: adicionar `npm overrides` forçando `uuid@14` (testar antes, pode quebrar `svix`).

### A4. Rate-limit em memória no Vercel serverless — bypass trivial sob concorrência ✅

**Evidência:**
- `lib/rate-limit.ts` — implementação `Map` em memória (`const buckets = new Map<string, Bucket>()`).
- Apenas 2 rotas usam a versão Upstash distribuída: `/api/conta/exportar` e `/api/conta/excluir`.
- Rotas com IA (chat, checklist, simulador, upload, entrevista) usam `rateLimit(...)` local.

**Risco:** Vercel cria múltiplas instâncias lambda independentes. Um atacante que dispare requests em paralelo atinge instâncias diferentes → cada uma tem seu próprio `Map` vazio → limit de 10/hora vira 10/hora × N instâncias. Em produto gated por Claude Sonnet (custo real de ~USD 0,01–0,05 por chamada), isso é **DoS econômico**.

**Correção (esforço: ~30 min):** mover TODOS os rate-limits de IA pra `rateLimitRemoto` (já implementado em `lib/rate-limit-upstash.ts`). Upstash tem plano free 10k commands/dia — sobra pro volume de pré-launch. Passos:

1. Substituir `import { rateLimit } from '@/lib/rate-limit'` por `import { rateLimitRemoto } from '@/lib/rate-limit-upstash'` nas 5 rotas: `chat`, `checklist`, `documento/validar`, `simulador/salvar`, `widget-ia/upload`, `entrevista`.
2. Configurar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` no Vercel (se ainda não tiver).
3. Manter `rateLimit` (in-memory) como fallback pra dev local.

---

## 🟡 MÉDIO — recomendado, aceitável nos 7 dias pós-launch

### M1. Sem boundaries de erro / loading globais ✅

**Evidência:** `find app -name "loading.tsx" -o -name "error.tsx" -o -name "not-found.tsx"` retorna vazio.

**Impacto:** quando uma Server Component lança exceção (ex: `/dashboard` se Supabase cair), o user vê tela branca + erro genérico do Next.js. Quando carrega, não há skeleton — fica travado.

**Correção (esforço: ~45 min):** criar
- `app/error.tsx` — boundary global com botão "Tentar de novo" + link pra `/`.
- `app/loading.tsx` — skeleton genérico.
- `app/not-found.tsx` — "Página não encontrada" com CTA pra `/dashboard` ou `/`.
- `app/(dashboard)/error.tsx` — específico pro shell autenticado com link pra suporte.

### M2. `console.log` vazando em 2 rotas de produção ✅

**Evidência:**
- `app/api/checklist/route.ts:13` — `console.log(\`[api/checklist] POST iniciado — modelo=${SONNET_MODEL}, key_presente=${!!process.env.ANTHROPIC_API_KEY}\`)`
- `app/api/entrevista/route.ts:50` — idem com HAIKU_MODEL (que é alias de Sonnet 4.6).

**Impacto:** não é PII, mas polui Vercel Logs e expõe que há uma env var `ANTHROPIC_API_KEY` (minor info leak). Deveria usar `lib/logger.ts` se é pra ficar.

**Correção (esforço: 5 min):** trocar os 2 `console.log` por `logDebug()` ou remover de vez — a info é inútil em produção (você sabe que o modelo é Sonnet 4.6; saber se a key está setada no Vercel é checkável via dashboard).

### M3. SEO — auth pages sem `robots: { index: false }` ✅

**Evidência:** pages sem `export const metadata`:
- `app/(auth)/login/page.tsx`
- `app/(auth)/cadastro/page.tsx`
- `app/(auth)/resetar-senha/page.tsx`
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/checklist/[id]/page.tsx`
- `app/(dashboard)/entrevista/*`
- `app/(dashboard)/como-funciona/page.tsx`
- `app/admin/*`

**Impacto:**
- Auth pages: crawler indexa `/login` e `/cadastro` (não é crítico mas fica feio no SERP — preferível um title específico + noindex se não quiser ranquear).
- Dashboard/admin: `app/robots.ts` já disallow `/dashboard`, `/admin` (via proxy.ts também bloqueia não-autenticado). A indexação real é improvável; o risco é 0 prático.

**Correção (esforço: ~20 min):** adicionar em cada página um bloco:
```tsx
export const metadata = {
  title: "Login · AgroBridge",
  robots: { index: false, follow: false },
}
```

### M4. Sem Open Graph / Twitter Cards — compartilhamento social quebrado ✅ (metadata) · ⏸️ (og-image.png pendente)

**Evidência:** `grep -rn "openGraph" app lib components` → nada encontrado. `public/` só tem SVGs default do `create-next-app`; sem `og-image.png`.

**Impacto:** quando alguém compartilha `agrobridge.app` no WhatsApp/LinkedIn/Twitter, o preview fica vazio ou genérico. Em produto SaaS onde indicação/marketing boca-a-boca importa, isso custa conversão.

**Correção (esforço: ~1h):**
1. Criar `public/og-image.png` (1200×630, logo + tagline "Crédito rural aprovado").
2. Em `app/layout.tsx`, adicionar no metadata:
```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://agrobridge.app"),
  title: "AgroBridge — Crédito rural aprovado",
  description: "...",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://agrobridge.app",
    siteName: "AgroBridge",
    title: "AgroBridge — Crédito rural aprovado",
    description: "Consultoria especializada em crédito rural via IA.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
}
```

### M5. Favicon e manifest incompletos ✅ (manifest.ts) · ⏸️ (icon.png / apple-icon.png pendentes)

**Evidência:** `app/` tem só `favicon.ico`. Faltam:
- `app/icon.png` (192/512 pra PWA)
- `app/apple-icon.png` (180×180)
- `app/manifest.ts` (Web App Manifest)

**Impacto:** mobile "Add to Home Screen" pega o ícone default do navegador. iOS fica especialmente feio.

**Correção (esforço: ~30 min):**
1. Exportar do Figma: `icon-512.png`, `apple-icon-180.png`, `favicon-32.png`.
2. Colocar em `app/icon.png`, `app/apple-icon.png` (Next 15+ auto-detecta).
3. Criar `app/manifest.ts` mínimo.

### M6. Erros em 5 rotas API usam `console.error` em vez de logger estruturado ✅ (webhook, conta/excluir, dossie) · ⏸️ (chat, checklist, widget-ia/upload — backlog pós-launch)

**Evidência:**
- `app/api/pagamento/webhook/route.ts` — 8 `console.error` (linhas 70, 153, 182, 212, 245, 292, 309, 327)
- `app/api/conta/excluir/route.ts` — 6 `console.error`
- `app/api/simulador/salvar/route.ts:67` — 1
- `app/api/chat/route.ts` — múltiplos
- `app/api/checklist/route.ts` — múltiplos

**Impacto:** quando Sentry for integrado (A2), esses erros NÃO serão capturados — `console.error` no Vercel vira linha de log, não evento agrupado. Perde-se agrupamento, alerta, breadcrumbs.

**Correção (esforço: ~1h):** migrar todas pra `capturarErroProducao(err, { route: '/api/...', user: user.id })` de `lib/logger.ts`. Com Sentry integrado (A2), esses vão virar issues agrupadas automaticamente.

### M7. `package.json` sem `engines` — sem Node version pinned ✅

**Evidência:**
```json
"scripts": { ... },
// "engines": { "node": ">=..." }  <-- AUSENTE
```

**Impacto:** se Vercel atualizar Node default (ex: 20 → 22) e quebrar algum binary (`sharp`, `@anthropic-ai/sdk`), o build quebra sem aviso. Vercel recomenda pinar.

**Correção (esforço: 2 min):**
```json
"engines": { "node": ">=20.11.0 <23" }
```

### M8. `tsconfig.json` sem `noUncheckedIndexedAccess` ⏸️ (backlog — refatoração grande, aceitável pós-launch)

**Evidência:** `tsconfig.json` tem `"strict": true` mas falta `noUncheckedIndexedAccess` e `exactOptionalPropertyTypes`.

**Impacto:** `arr[0].prop` em arr possivelmente vazio não dá erro de typecheck — bug latente comum em loops.

**Correção (esforço: ~2h, talvez mais):** ligar `noUncheckedIndexedAccess: true` e corrigir os casos de acesso de array/object sem guard. Muito trabalho pra valor incremental — **aceitável pós-launch.**

### M9. Cores hex hardcoded em componentes do simulador ⏸️ (backlog — refatoração de design system, aceitável pós-launch)

**Evidência:**
- `components/simulador/SimuladorClient.tsx:794` — `style={{background: "#0b0d0f"}}`
- `components/simulador/HistoricoClient.tsx` — cores de gráfico hardcoded
- `components/simulador/ComparadorClient.tsx` — idem
- `components/landing/hero.tsx:74` — `["#e85d4a", "#e7b844", "#5cbd95"]` em decoração
- `app/(auth)/resetar-senha/page.tsx:100` — `rgba(212,113,88,0.30)`

**Impacto:** rebranding futuro obrigará caça ao hex. Não é bug, é dívida de design-system.

**Correção (esforço: ~2h):** mapear tudo pra CSS variables definidas em `app/globals.css` / `primitives.tsx`. Aceitável pós-launch.

### M10. Sitemap não inclui `/privacidade` e `/termos`... espera ✅ (/como-funciona adicionado)

**Revisão:** `app/sitemap.ts` INCLUI `/privacidade` (linha 33) e `/termos` (linha 39) — ok. **Falso positivo, ignorar.**

**Real problema menor:** sitemap não inclui `/como-funciona` (página pública de explicação do produto) e `/planos` (gated pós-login, então talvez certo excluir).

**Correção (esforço: 5 min):** adicionar `/como-funciona` no `app/sitemap.ts` se a página ficar pública.

---

## 🟢 BAIXO — nice-to-have, backlog

### B1. 14 warnings do ESLint ✅

Todos do tipo `no-unused-vars` ou `no-img-element`. Aparecem em testes/helpers e em `lib/agents/auditor.ts` (variáveis de TODO futuro). **Não bloqueante.**

**Correção:** limpar ao passar por cada arquivo.

### B2. `<img>` em `DossieCard.tsx:216` em vez de `<Image />` ✅ (eslint-disable com justificativa — URL dinâmica de provedor externo)

Warning do Next. Impacto mínimo (é uma imagem só, preview de doc). **Correção: 5 min**, trocar pra `next/image`.

### B3. 8 TODOs em `lib/mcr/*` ⏸️ (decisão humana — Paulo precisa confirmar dados do Plano Safra)

Referentes a dados de taxas, bancos, precedência documental. São marcadores de "Paulo revisar valores reais do Plano Safra 2026" — não são bugs, são notas de produto. **Não bloqueante.**

### B4. Sem `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` ⏸️ (não aplicável agora — app não usa SharedArrayBuffer/WASM)

Headers modernos, só fazem diferença se a app usa `SharedArrayBuffer` ou WASM. **Não aplicável agora.**

### B5. Copy "pra" em páginas formais de auth ⏸️ (subjetivo — decisão de voz da marca pra Paulo)

Exemplos: `login/page.tsx:138`, `resetar-senha/page.tsx:163`. Preferência de tone — landing é casual por design, auth deveria ser um pouco mais formal. Subjetivo.

### B6. Dashboard server vs `dashboard` route ✅ (metadata adicionada em app/page.tsx)

`app/page.tsx` (home pública) não tem `export const metadata` próprio — herda do layout. Tecnicamente ok mas perde-se oportunidade de um title diferente ("AgroBridge | Dossiê de crédito rural aprovado no banco"). **Correção: 2 min.**

---

## ✅ Passou sem achados (resumo)

### Segurança de aplicação

- **Secrets:** `.gitignore` cobre `.env*`, com exceção explícita de `.env.example`. `git log --all --full-history -- .env .env.local` retornou 0 commits. `scripts/check-secrets.sh` ✅.
- **CSP:** `default-src 'self'`; `frame-ancestors 'none'`; img/connect só domínios autorizados (`*.supabase.co`, `api.anthropic.com`, `api.resend.com`).
- **HSTS:** `max-age=63072000; includeSubDomains; preload` (2 anos).
- **X-Frame-Options:** `DENY`. **Referrer-Policy:** `strict-origin-when-cross-origin`. **Permissions-Policy:** camera/mic/geo/payment/usb/magnet desabilitados.
- **CSRF:** cookies do Supabase SSR são HttpOnly+SameSite; não há endpoint GET que mute estado.
- **SQL injection:** zero uso de raw SQL no código; tudo via `supabase-js` (parametrizado).
- **XSS:** zero `dangerouslySetInnerHTML`, `eval`, `new Function`, `innerHTML =`.
- **IDOR:** endpoints que recebem `id` filtram por `user_id` ou usam RLS (ex: `app/api/processos/[id]/route.ts`, `documento/validar`).
- **Open redirect:** `lib/safe-redirect.ts::sanitizarCaminhoInterno` rejeita `/`, `//`, `/\`, CRLF. Usado em `auth/callback`.
- **Webhook:** HMAC-SHA256 com `timingSafeEqual` + fallback por payload secret. Idempotência via `webhook_events (provider, event_id) UNIQUE`.
- **Rate-limit:** presente em login (5/15min), signup (3/h), LGPD export (1/dia), LGPD delete (3/h step1, 10/h step2), chat/simulador/checklist/upload/entrevista (por tier). ⚠️ ver A4 — maioria in-memory.
- **Upload:** magic bytes via `lib/file-sniff.ts` + MIME allowlist + tamanho (100MB storage, 20MB pra IA) + sanitização de filename (`[^a-zA-Z0-9._-]` → `_`).
- **Auth:** Supabase SSR com refresh em `proxy.ts`. Anti-enumeração em signup (`lib/auth/anti-enumeracao.ts`). Email confirmation obrigatória.
- **Admin:** `app/admin/layout.tsx` chama `getAdminUser()` (check por email em env var `ADMIN_EMAILS`) e redireciona para login. API admin (`reprocessar-compra`) chama o mesmo guard.

### LGPD (Art. 18)

- **Privacidade:** `app/privacidade/page.tsx` — 411 linhas (conteúdo substancial).
- **Termos:** `app/termos/page.tsx` — 222 linhas.
- **V (portabilidade):** `/api/conta/exportar` gera JSON + signed URLs (TTL 15 min). 1 export/dia via Upstash.
- **VI (eliminação):** `/api/conta/excluir` com dupla confirmação (token 32 bytes, TTL 30 min), soft-delete cascata via RPC `soft_delete_user_data`, anonimiza email, ban de 100 anos.
- **Logs/audit:** `audit_events` table (RLS self-only, append-only); `logAuditEvent()` nas rotas críticas.

### RLS em todas as tabelas públicas

Verificadas em migrations: `processos`, `mensagens`, `checklist_itens`, `uploads`, `perfis_lead`, `simulacoes`, `compras`, `webhook_events`, `audit_events`, `pedidos_exclusao_conta`. Todas com `ENABLE ROW LEVEL SECURITY` + policies explícitas.

### Qualidade de código

- `npm run build` → clean, todas 53 rotas geradas.
- `npx tsc --noEmit` → EXIT=0.
- `npm run lint` → 0 erros, 14 warnings (B1).
- `npx vitest run __tests__` → **13/13 passed em 201ms**.
- `npm run test:e2e` (rodado na sessão anterior) → **17/17 passed**.
- `npx playwright test` scaffold completo: 8 specs, 2 projects (anônimo + autenticado), serial workers.
- Zero `: any` em `lib/**` e `app/api/**`.
- `proxy.ts` (não `middleware.ts`) — corretamente em Next.js 16.
- `strict: true` no tsconfig.

### Banco de dados

- 22 migrations numeradas sequencialmente (`YYYYMMDDHHMMSS_nome.sql`).
- 31 índices criados explicitamente (`CREATE INDEX`).
- 15 foreign keys com `ON DELETE CASCADE` onde apropriado (processos, simulacoes, mensagens).
- 15 RPCs `SECURITY DEFINER` pra mutações privilegiadas (`confirmar_pagamento_v2/v3`, `soft_delete_user_data`, `iniciar_geracao_dossie`, etc) — padrão correto pra não expor service_role no client.
- Zero migration com DROP destrutivo. Padrão aditivo mantido (`CREATE OR REPLACE`, `ADD COLUMN IF NOT EXISTS`).

### Performance (estimativa estática)

- `poweredByHeader: false` (sem header `X-Powered-By: Next.js`).
- `outputFileTracingIncludes` para empacotar prompts de IA corretamente nas funções serverless (evita "file not found" em runtime).
- Build gerou assets sem warnings.
- Fontes via `next/font` (Geist + Geist_Mono), `display: swap`, `subsets: ['latin']` — correto.
- Code-splitting automático do Next 16 (páginas dinâmicas são `ƒ`, estáticas são `○` no build output).

⚠️ **não rodado:** Lighthouse real (requer dev server + browser headless, fora do escopo desta sessão). Recomendo rodar `npm run dev` + `lighthouse https://localhost:3000 --view` antes de anunciar em redes — o que eu posso auditar estaticamente está ok, mas CWV real (LCP/INP/CLS) depende de imagens reais + 3rd-party scripts que não estão aqui ainda.

---

## Veredito final

### ⚠️ PRONTO COM RESSALVAS

**Aceita pós-launch (dentro da primeira semana):**
- M1 a M10 e todos os BAIXOS.

**Fazer HOJE (antes do lançamento real — 1º lead pago que não seja o Paulo):**

| # | Ação | Esforço | Valor |
|---|---|---|---|
| 1 | Criar `.github/workflows/ci.yml` (test + lint + typecheck + build) | 30 min | Evita deploy quebrado |
| 2 | Integrar Sentry (`@sentry/nextjs` + DSN no Vercel) | 1 h | Visibilidade de erros em produção |
| 3 | Migrar rate-limit de IA (5 rotas) para `rateLimitRemoto` Upstash | 30 min | Evita DoS econômico em Sonnet |
| 4 | Remover 2 `console.log` debug em `checklist` e `entrevista` route | 5 min | Limpeza de logs |
| 5 | Adicionar `robots: { index: false }` em `login`, `cadastro`, `resetar-senha` | 20 min | Evita SERP sujo |
| 6 | Adicionar Open Graph + `og-image.png` em `app/layout.tsx` | 1 h | Compartilhamento social |
| 7 | Adicionar `engines: { node: '>=20.11.0 <23' }` em `package.json` | 2 min | Evita build break em upgrade do Vercel |

**Total: ~3h30 de trabalho focado.**

Depois disso: lançar, monitorar Sentry nos primeiros 7 dias, iterar sobre os MÉDIOS conforme sinal real de uso aparece.

---

### Observações finais

O projeto tem maturidade incomum pra fundador solo:

- APEX-SEC hardening (race conditions, IDOR, anti-enumeração, dossiê lock) já rodou antes do launch.
- LGPD implementado de verdade, não só página estática.
- 22 migrations ordenadas + RLS em 100% das tabelas PII + RPCs `SECURITY DEFINER`.
- Idempotência de webhook com `UNIQUE (provider, event_id)` + HMAC timing-safe.
- Rate-limit por tier (Free/Bronze/Prata/Ouro) acoplado a modelo único (Sonnet 4.6) com prompt caching.

As lacunas são quase 100% operacionais (CI, Sentry, SEO social) — não arquiteturais. Se os 7 itens de 3h30 forem fechados antes do 1º lead pago, o produto está em melhor forma pré-launch que 95% dos SaaS brasileiros que vejo subindo em produção.

**Boa campanha. 🌾**
