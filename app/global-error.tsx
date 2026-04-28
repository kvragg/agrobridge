'use client'

// Captura erros que escapam de TODO o app — root layout, providers,
// React render errors. Diferente de `app/error.tsx` (que só pega
// erros dentro do segmento), este é o último guarda-chuva antes de
// virar tela em branco.
//
// Skill Sentry oficial:
// github.com/getsentry/sentry-for-ai/blob/main/skills/sentry-nextjs-sdk/SKILL.md

import * as Sentry from '@sentry/nextjs'
import NextError from 'next/error'
import { useEffect } from 'react'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
