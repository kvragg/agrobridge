# Sentry — estado e operação

Sentry plugado em produção desde 2026-04-27. Validado end-to-end:
captura manual + automática + source maps + alerts.

## Configuração ativa

**Projeto:** `agrobridge` / `javascript-nextjs` (sentry.io)
**DSN público:** `https://6b4edf9a20243c01294c3a39cddb0c75@o4511271772160000.ingest.us.sentry.io/4511295007358976`
**Auth token:** sntryu_*** (user-scope, owner do org)

**Env vars no Vercel (Production):**
- `SENTRY_DSN` — captura server-side
- `NEXT_PUBLIC_SENTRY_DSN` — captura browser (mesmo DSN)
- `SENTRY_AUTH_TOKEN` — upload de source maps no build
- `SENTRY_ORG=agrobridge`
- `SENTRY_PROJECT=javascript-nextjs`

**Preview/Development NÃO têm DSN setado** — código guarda atrás de
`if (process.env.SENTRY_DSN)` então vira no-op puro. Adicionar ao
Preview só quando começar a abrir PRs com regularidade.

## Como o sistema captura erros

| Cenário | O que captura |
|---|---|
| Erro em rota API (`/api/dossie` quebrou) | `lib/logger.ts :: capturarErroProducao()` chama `Sentry.captureException` |
| Throw em route handler / RSC / server action | `instrumentation.ts :: onRequestError = Sentry.captureRequestError` (automático) |
| Erro JS no browser | `instrumentation-client.ts` window error handler |
| Erro no root layout (último guarda-chuva) | `app/global-error.tsx` |
| Stack trace minificado em prod | Source maps subidos pelo `withSentryConfig` no build (release = commit hash) |
| Adblocker bloqueando Sentry | Tunnel route `/monitoring` proxy via mesmo domínio |
| Replay visual ~30s antes do erro | Session replay (`replaysOnErrorSampleRate: 1.0`) com `maskAllText` |

## Decisões PII (LGPD)

Diferente do default do skill oficial Sentry — AgroBridge captura
CPF/CNPJ, nome, dados de crédito rural. Configuração defensiva:
- `sendDefaultPii: false` (server e client)
- `includeLocalVariables: false` (server)
- Replay com `maskAllText: true` + `blockAllMedia: true`
- `lib/logger.ts` sanitiza `CAMPOS_PROIBIDOS` antes de chegar no Sentry

## Alerts configurados

1. **High priority issues** (default Sentry): notifica IssueOwners → ActiveMembers via email
2. **Erro novo em produção** (rule `16975163`): toda new issue em prod
   manda email pra Paulo (`4475502`), no máx 1x a cada 30min

Pra adicionar/editar alerts: https://sentry.io/settings/agrobridge/projects/javascript-nextjs/alerts/

## Health check externo

`/api/health` (público em `proxy.ts :: PUBLIC_API_PREFIXES`) retorna
`{ok, env, commit, ts}`. Apontar UptimeRobot/BetterStack pra
`https://agrobridge.space/api/health` — Sentry vê erro lógico,
uptime monitor vê prod inteiro caído.

## Custos

Free tier: 5k erros/mês + 50 replays/mês + 10k transactions/mês.
AgroBridge esperado: <100 erros/mês (solo, low traffic). Margem 50x.

## Desligar emergencialmente

Remove `SENTRY_DSN` do Vercel (Production) → próximo deploy não tem
captura. Tudo guarda atrás do `if (process.env.SENTRY_DSN)`.

## Arquivos relevantes

- `instrumentation.ts` — server init + `onRequestError`
- `instrumentation-client.ts` — browser init + replay
- `sentry.server.config.ts` — node runtime
- `sentry.edge.config.ts` — edge runtime
- `app/global-error.tsx` — root layout error boundary
- `app/error.tsx` — segment error boundary (também captura)
- `next.config.ts` — `withSentryConfig` (source maps + tunnel)
- `lib/logger.ts` — `capturarErroProducao()` ponto único de captura manual
- `app/api/health/route.ts` — health check pra uptime monitors
