// Next.js client-side instrumentation — executa no browser antes da
// hidratação React. Inicializa Sentry se NEXT_PUBLIC_SENTRY_DSN estiver
// configurado. Sem DSN, o módulo dynamic-import vira no-op (zero
// overhead).
//
// Docs: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md
//
// PII: Sentry default já é sendDefaultPii=false. O AgroBridge nunca
// envia identidade real (nome/email/cpf) — só userId opaco vindo do
// auth, igual logger server-side.

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment:
          process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
        tracesSampleRate: 0.1,
        sendDefaultPii: false,
        // Session replay: 0% das sessões normais, 100% quando há erro.
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
    })
    .catch(() => {
      // Falha de init não pode quebrar a página.
    })
}

// Hook do Next 16 — Sentry usa pra adicionar breadcrumb de navegação.
// Carregado dinamicamente; se Sentry não estiver pronto, vira no-op.
export async function onRouterTransitionStart(
  url: string,
  navigationType: 'push' | 'replace' | 'traverse'
): Promise<void> {
  if (!dsn) return
  try {
    const Sentry = await import('@sentry/nextjs')
    Sentry.captureRouterTransitionStart?.(url, navigationType)
  } catch {
    // No-op em qualquer falha.
  }
}
