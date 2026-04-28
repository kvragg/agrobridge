// Sentry — Edge runtime
// Carregado via instrumentation.ts quando NEXT_RUNTIME === "edge".
// Edge runtime não suporta includeLocalVariables.

import * as Sentry from '@sentry/nextjs'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    sendDefaultPii: false,
  })
}
