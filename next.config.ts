import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const isDev = process.env.NODE_ENV === 'development'

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.anthropic.com https://api.resend.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-XSS-Protection', value: '0' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Garante que os prompts lidos via fs.readFileSync sejam empacotados no
  // bundle das funções serverless do Vercel.
  outputFileTracingIncludes: {
    'app/api/entrevista/route': ['./prompts/**/*'],
    'app/api/checklist/route': ['./prompts/**/*'],
    // PDF v12 lê fontes self-hosted em ./public/fonts/ via fs.readFileSync.
    // O Next.js inclui /public no bundle Vercel automaticamente, então
    // não precisa entry adicional aqui — só mencionado pra contexto.
    'app/api/dossie/route': ['./prompts/**/*'],
    'app/api/viabilidade/route': ['./prompts/**/*'],
  },
  headers: async () => [
    { source: '/(.*)', headers: securityHeaders },
  ],
}

// Sentry build wrapper — só faz upload de source maps quando
// SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT estiverem setados
// (build no Vercel). Em dev/CI sem token, vira no-op silencioso e o
// build segue normal. Em prod sem token, source maps ficam públicas
// porém ilegíveis no Sentry — não bloqueia.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Inclui chunks do client-side no upload (default só inclui server).
  widenClientFileUpload: true,
  // Tunnel route: browser fala com /monitoring → Vercel proxy → Sentry.
  // Bypassa adblockers e mantém CSP enxuta (sem precisar liberar
  // *.sentry.io em connect-src).
  tunnelRoute: '/monitoring',
  // Não faz upload se as creds não estiverem disponíveis (dev local
  // sem auth token). Sem isso, o build do Vercel pra Preview branches
  // sem o secret quebraria.
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
})
