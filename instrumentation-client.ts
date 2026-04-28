// Next.js client-side instrumentation — browser, antes da hidratação React.
// Init Sentry condicional: sem NEXT_PUBLIC_SENTRY_DSN, vira no-op puro.
//
// Docs: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md
// Skill: github.com/getsentry/sentry-for-ai/blob/main/skills/sentry-nextjs-sdk/SKILL.md
//
// Decisões PII (LGPD): AgroBridge tem formulários com dados sensíveis.
// `sendDefaultPii: false` + replay só em erro (não amostra sessões
// normais) + `maskAllText` + `blockAllMedia` no replay.

import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    sendDefaultPii: false,
    // Session Replay: 0% em sessões normais, 100% quando há erro.
    // Grava ~30s de DOM antes do erro pra debug visual.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  })
}

// Hook do Next 16 — Sentry usa pra adicionar breadcrumb de navegação
// em cada router transition. Com Sentry desligado, a função existe mas
// vira no-op interno.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
