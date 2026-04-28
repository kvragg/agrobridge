// Sentry — Node.js server runtime
// Carregado via instrumentation.ts quando NEXT_RUNTIME === "nodejs".
//
// Decisões PII (LGPD): AgroBridge captura CPF/CNPJ, nome, dados de
// crédito rural. Mantemos `sendDefaultPii: false` e
// `includeLocalVariables: false` — diferente do default do skill
// oficial. Logger em lib/logger.ts já sanitiza CAMPOS_PROIBIDOS.

import * as Sentry from '@sentry/nextjs'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    sendDefaultPii: false,
    includeLocalVariables: false,
  })
}
