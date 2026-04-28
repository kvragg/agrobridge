import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas de API que NÃO exigem sessão autenticada:
// - /api/auth/*            (signup, login, logout, resend — lidam com auth elas mesmas)
// - /api/pagamento/webhook (autenticado via HMAC do Cakto, não via sessão)
// - /api/health            (health check público pra UptimeRobot/BetterStack)
const PUBLIC_API_PREFIXES = ['/api/auth', '/api/pagamento/webhook', '/api/health']

// Rotas web (páginas) que exigem sessão autenticada.
// `/admin` exige sessão + check de admin no layout — middleware aqui só
// garante que sem-sessão recebe 307 limpo (Next 16 retorna 200 com shell
// quando o redirect() é só do layout, comportamento estranho).
const ROTAS_PROTEGIDAS_WEB = ['/dashboard', '/entrevista', '/checklist', '/planos', '/conta', '/admin']

function requerAuthWeb(pathname: string): boolean {
  return ROTAS_PROTEGIDAS_WEB.some((rota) => pathname.startsWith(rota))
}

function requerAuthApi(pathname: string): boolean {
  if (pathname.startsWith('/api/')) {
    if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return false
    return true
  }
  return false
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh de sessão — obrigatório para SSR com Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const authWeb = requerAuthWeb(pathname)
  const authApi = requerAuthApi(pathname)

  if ((authWeb || authApi) && !user) {
    if (authApi) {
      return Response.json({ erro: 'Não autenticado' }, { status: 401 })
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Evita cache de conteúdo autenticado em proxies/CDN
  if (authWeb || authApi) {
    supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0')
    supabaseResponse.headers.set('Pragma', 'no-cache')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // `monitoring` é o tunnel route do Sentry (next.config.ts) — não
    // passa por auth/Supabase getUser pra economizar overhead em error
    // reports do browser.
    '/((?!monitoring|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
