import type { MetadataRoute } from "next"

/**
 * Web App Manifest (PWA).
 *
 * TODO (Paulo — fora do escopo de código): exportar do Figma:
 *   - public/icon-192.png (192×192, para Android)
 *   - public/icon-512.png (512×512, para Android/PWA)
 *   - public/apple-icon-180.png (180×180, iOS Home Screen)
 *   - public/og-image.png (1200×630, social preview)
 * Enquanto não existem, referenciamos /favicon.ico como fallback.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgroBridge",
    short_name: "AgroBridge",
    description:
      "Consultoria especializada em crédito rural. Entrevista com IA, checklist personalizado e laudo técnico.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d0f",
    theme_color: "#14532d",
    lang: "pt-BR",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  }
}
