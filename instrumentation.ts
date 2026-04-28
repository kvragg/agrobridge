// Next.js instrumentation hook — executado uma vez por runtime (node/edge)
// antes de qualquer request. Inicializa Sentry se SENTRY_DSN estiver
// configurado. Sem DSN, vira no-op (zero overhead além do import).
//
// Docs: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md

import type { captureRequestError } from '@sentry/nextjs'

type CaptureRequestErrorArgs = Parameters<typeof captureRequestError>

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

// Next 16 hook — chamado pra todo erro não-tratado em Server Components,
// route handlers, server actions, middleware. Sentry tem helper que faz
// o forward correto pra captureException com contexto de request.
// Sem DSN, no-op silencioso.
export async function onRequestError(
  err: unknown,
  request: CaptureRequestErrorArgs[1],
  errorContext: CaptureRequestErrorArgs[2]
): Promise<void> {
  if (!process.env.SENTRY_DSN) return
  try {
    const Sentry = await import('@sentry/nextjs')
    Sentry.captureRequestError(err, request, errorContext)
  } catch {
    // Defensivo — falha de captura não pode propagar pra request handler.
  }
}
