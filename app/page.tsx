import { Nav } from "@/components/landing/nav"
import { Hero } from "@/components/landing/hero"
import { Problem } from "@/components/landing/problem"
import { Solution } from "@/components/landing/solution"
import { Differentiator } from "@/components/landing/differentiator"
import { HowItWorks } from "@/components/landing/howitworks"
import { Proof } from "@/components/landing/proof"
import { Plans } from "@/components/landing/plans"
import { CTA } from "@/components/landing/cta"
import { Faq } from "@/components/landing/faq"
import { Footer } from "@/components/landing/footer"

export const metadata = {
  title: "Crédito rural aprovado · dossiê técnico pronto pra banco",
  description:
    "Entrevista com IA, checklist personalizado do MCR e dossiê técnico no padrão que o comitê de crédito aprova. Do cadastro ao laudo.",
  alternates: { canonical: "/" },
}

export default function Home() {
  return (
    <div className="landing-root">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Differentiator />
        <HowItWorks />
        <Proof />
        <Plans />
        <CTA />
        <Faq />
      </main>
      <Footer />
    </div>
  )
}
