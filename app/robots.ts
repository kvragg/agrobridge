import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.space'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        // Rotas autenticadas / API não devem ser crawleadas
        disallow: [
          '/api/',
          '/dashboard',
          '/dashboard/',
          '/entrevista',
          '/entrevista/',
          '/checklist/',
          '/planos',
          '/conta',
          '/conta/',
          '/auth/callback',
          '/auth/confirmado',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
