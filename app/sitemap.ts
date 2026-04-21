import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agrobridge.app'
  const agora = new Date()

  return [
    {
      url: `${base}/`,
      lastModified: agora,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${base}/login`,
      lastModified: agora,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${base}/cadastro`,
      lastModified: agora,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${base}/resetar-senha`,
      lastModified: agora,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}/privacidade`,
      lastModified: agora,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${base}/termos`,
      lastModified: agora,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
