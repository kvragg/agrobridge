import type { Metadata } from "next"
import type { ReactNode } from "react"

/**
 * Layout do grupo (auth) — login, cadastro, resetar-senha.
 *
 * Aplica `robots: noindex` pra todo o grupo. Login/cadastro/reset
 * aparecerem no Google não traz valor SEO e polui o SERP da marca.
 * O acesso continua público (é só um sinal pra crawlers).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
