// Rota temporária pra validar integração Sentry end-to-end.
// Guard: só dispara erro com ?token correto pra não virar pegadinha pública.
// Apagar depois do primeiro evento aparecer no dashboard Sentry.

import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (token !== 'agrobridge-sentry-2026-04-27') {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 404 })
  }
  throw new Error('Sentry integration test — pode ignorar')
}
