// Next.js instrumentation hook — executado uma vez por runtime (node/edge)
// antes de qualquer request. Carrega config Sentry separada por runtime.
// Sem SENTRY_DSN, configs viram no-op (zero overhead além do import).
//
// Docs: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md
// Skill: github.com/getsentry/sentry-for-ai/blob/main/skills/sentry-nextjs-sdk/SKILL.md

import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Captura erros não-tratados em Server Components, route handlers,
// server actions, middleware. Requer @sentry/nextjs >= 8.28.0
// (temos 10.50.0).
export const onRequestError = Sentry.captureRequestError
