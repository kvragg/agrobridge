# Sentry — passos manuais pra ligar

A infra do Sentry está toda montada no código. Falta só **3 passos
operacionais** que precisam ser feitos no painel web (não dá pra
automatizar). Depois disso, captura ativa em ~2min.

## 1) Criar projeto no Sentry

1. Vai em https://sentry.io/signup (free tier — 5k erros/mês, suficiente)
2. Login com Google → cria org `agrobridge`
3. **Create Project** → plataforma `Next.js` → nome `agrobridge-web`
4. Copia o **DSN** que aparece (formato: `https://xxx@yyy.ingest.sentry.io/zzz`)
5. Em **Settings → Auth Tokens** → cria token com escopo
   `project:releases` + `project:write` → copia (vamos chamar de
   `SENTRY_AUTH_TOKEN`)
6. Anota o **slug da org** (`agrobridge`) e o **slug do projeto**
   (`agrobridge-web`)

## 2) Adicionar env vars no Vercel

Em **Vercel → agrobridge → Settings → Environment Variables**, adiciona:

| Nome | Valor | Scope |
|---|---|---|
| `SENTRY_DSN` | (DSN do passo 1) | Production + Preview |
| `NEXT_PUBLIC_SENTRY_DSN` | (mesmo DSN) | Production + Preview |
| `SENTRY_ORG` | `agrobridge` | Production + Preview |
| `SENTRY_PROJECT` | `agrobridge-web` | Production + Preview |
| `SENTRY_AUTH_TOKEN` | (token do passo 1) | Production + Preview |

**Não** marca "Development" — não queremos poluir o painel com erros
do `npm run dev` local.

> Por que dois DSNs? Server (`SENTRY_DSN`) é privado, ficou no runtime
> Node. Client (`NEXT_PUBLIC_SENTRY_DSN`) precisa do prefixo
> `NEXT_PUBLIC_` pra ser exposto no bundle do browser. Ambos apontam
> pro mesmo projeto Sentry.

## 3) Triggar deploy

Push qualquer commit (ou clica **Redeploy** na última deploy do
Vercel). O `withSentryConfig` no build vai:

- Subir source maps pro Sentry (stack trace legível)
- Empacotar o tunnel route `/monitoring`
- Init do Sentry (server + client) na primeira request

## 4) Validar (1min)

1. Abre https://agrobridge.com.br/api/health → deve voltar `{"ok":true,...}`
2. No painel Sentry, vai em **Issues** — deve estar vazio (zero erros = bom)
3. Pra confirmar que captura realmente funciona, força um erro:
   - Acessa `/api/dossie` sem auth (vai dar 401, não conta como erro)
   - Ou cria temporariamente `/api/debug/sentry-test` com `throw new Error('teste sentry')` → faz GET → vê chegar no painel → deleta a rota
4. Configura **Alerts → New Alert** → "An issue is first seen" →
   email `suporte@agrobridge.com.br`

## Como o sistema usa Sentry depois de ligado

| Cenário | O que acontece |
|---|---|
| Erro em rota API (`/api/dossie` quebrou) | `capturarErroProducao()` em `lib/logger.ts` chama `Sentry.captureException` automático |
| Erro em Server Component / RSC | Hook `onRequestError` em `instrumentation.ts` captura |
| Erro JS no browser (botão não funciona) | `instrumentation-client.ts` captura via window error handler |
| Replay visual do erro UI | Session replay grava ~30s antes do erro (`replaysOnErrorSampleRate: 1.0`) |
| Stack trace minificada em prod | Source maps subidos no build → painel mostra código original |
| Adblocker bloqueando Sentry | Tunnel route `/monitoring` bypassa (browser fala com domínio próprio) |

## Custos

- **Free tier:** 5.000 erros/mês + 50 replays/mês + 10k transactions/mês
- **AgroBridge esperado em prod:** <100 erros/mês (solo, low traffic)
- Margem 50x. Sem risco de overage.

## Desligar emergencialmente

Remove `SENTRY_DSN` do Vercel → próximo deploy não tem captura.
Código todo guarda atrás do `if (!process.env.SENTRY_DSN) return`,
então é seguro.

## Arquivos relevantes (referência)

- `instrumentation.ts` — init server (node + edge) + `onRequestError`
- `instrumentation-client.ts` — init browser + replay + router transitions
- `next.config.ts` — `withSentryConfig` wrapper (source maps + tunnel)
- `lib/logger.ts:119` — `capturarErroProducao()` (ponto único de captura manual)
- `app/api/health/route.ts` — health check pra UptimeRobot/BetterStack
