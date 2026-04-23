// Next.js instrumentation hook — executado uma vez por runtime (node/edge)
// antes de qualquer request. Inicializa Sentry se SENTRY_DSN estiver
// configurado. Sem DSN, vira no-op (zero overhead além do import).
//
// Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (!process.env.SENTRY_DSN) return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs')
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      // PII: a gente já sanitiza no logger via redactPII; Sentry default
      // é sendDefaultPii=false.
      sendDefaultPii: false,
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs')
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      sendDefaultPii: false,
    })
  }
}
