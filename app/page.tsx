import Link from "next/link"
import {
  MessageSquare,
  ClipboardList,
  Upload,
  FileText,
  Bot,
  ListChecks,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  Lock,
  Building2,
  Leaf,
  ArrowRight,
  CheckCircle,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import FadeIn from "@/components/ui/fade-in"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Step {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  description: string
}

interface Benefit {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

// ─── Data ────────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    icon: MessageSquare,
    title: "Entrevista IA",
    subtitle: "Conte seu projeto em minutos",
    description:
      "Responda 8 perguntas inteligentes. A IA mapeia seu perfil: tipo de produtor, finalidade do crédito e banco preferido.",
  },
  {
    icon: ClipboardList,
    title: "Checklist personalizado",
    subtitle: "Saiba exatamente o que buscar",
    description:
      "Receba a lista precisa de documentos exigidos — sem nada a mais, sem nada faltando. Ajustado ao seu banco e linha de crédito.",
  },
  {
    icon: Upload,
    title: "Upload e validação",
    subtitle: "A IA confere tudo por você",
    description:
      "Envie os documentos e aguarde a verificação automática de prazo, legibilidade e consistência com o MCR.",
  },
  {
    icon: FileText,
    title: "Dossiê completo",
    subtitle: "Entregue pronto ao banco",
    description:
      "PDF organizado com capa, índice, documentos validados e carta de defesa de crédito redigida pela IA.",
  },
]

const BENEFITS: Benefit[] = [
  {
    icon: Bot,
    title: "Entrevista inteligente",
    description:
      "IA treinada no MCR conduz a entrevista em 8 perguntas. Adapta o processo para PF ou PJ, custeio ou investimento.",
  },
  {
    icon: ListChecks,
    title: "Checklist personalizado",
    description:
      "Documentos certos para o seu caso. Sem lista genérica — apenas o que o seu banco exige para a sua linha de crédito.",
  },
  {
    icon: ExternalLink,
    title: "Guia de emissão",
    description:
      "Link oficial e passo a passo de cada documento. Saiba onde emitir CAR, CCIR, ITR, CNDs e certidões ambientais.",
  },
  {
    icon: CheckCircle,
    title: "Validação automática",
    description:
      "A IA verifica prazo de validade, legibilidade e consistência de cada documento antes de montar o dossiê.",
  },
  {
    icon: Briefcase,
    title: "Defesa de crédito",
    description:
      "Argumentação profissional redigida pela IA com base no perfil do produtor, para aumentar as chances de aprovação.",
  },
  {
    icon: Lock,
    title: "Segurança total (LGPD)",
    description:
      "Dados isolados por produtor com Row Level Security. Criptografia em trânsito e em repouso. Nada compartilhado entre clientes.",
  },
]

const BANKS = [
  "Banco do Brasil",
  "Caixa Econômica",
  "Bradesco",
  "Santander",
  "Safra",
  "BRB",
  "BTG Pactual",
  "XP Investimentos",
  "BNB",
]

const COOPERATIVAS = ["Sicredi", "Sicoob", "Cresol", "Unicred"]

const YEAR = new Date().getFullYear()

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <main>
        <Hero />
        <Institutions />
        <HowItWorks />
        <Benefits />
        <SocialProof />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}

// ─── Sections ────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-gray-500 sm:flex">
          <a href="#como-funciona" className="transition-colors hover:text-gray-900">
            Como funciona
          </a>
          <a href="#beneficios" className="transition-colors hover:text-gray-900">
            Benefícios
          </a>
          <a href="#instituicoes" className="transition-colors hover:text-gray-900">
            Bancos
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-lg bg-[#166534] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#14532d]"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-28 pt-24 text-center">
      <div className="mx-auto max-w-3xl">
        <span className="inline-block rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#166534]">
          Criado por ex-bancários do sistema
        </span>

        <h1 className="mt-7 text-5xl font-black leading-[1.08] tracking-tight text-gray-950 sm:text-6xl lg:text-7xl">
          Crédito rural sem
          <br />
          <span className="text-[#16a34a]">burocracia perdida</span>
        </h1>

        <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-gray-500">
          IA que entrevista, gera checklist, valida documentos e monta
          o dossiê completo com defesa de crédito — pronto para entregar ao banco.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/cadastro"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#166534] px-8 py-4 text-base font-bold text-white transition-colors hover:bg-[#14532d] sm:w-auto"
          >
            Começar agora
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 px-8 py-4 text-base font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:w-auto"
          >
            Ver como funciona
          </a>
        </div>

        <div className="mt-14 flex items-center justify-center gap-2 text-sm text-gray-400">
          <ShieldCheck className="h-4 w-4 text-[#16a34a]" />
          <span>Seguro, privado e em conformidade com a LGPD</span>
        </div>
      </div>
    </section>
  )
}

function Institutions() {
  return (
    <section id="instituicoes" className="border-t border-gray-100 bg-[#f9fafb] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">
            Compatível com as principais instituições
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-gray-500">
            Checklists e dossiês personalizados conforme as exigências de cada banco e cooperativa.
          </p>
        </FadeIn>

        <FadeIn delay={100} className="mt-12">
          <div className="flex items-center gap-3 mb-5">
            <Building2 className="h-4 w-4 text-gray-400" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Bancos
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="flex flex-wrap gap-3">
            {BANKS.map((bank) => (
              <div
                key={bank}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:border-[#166534]/30 hover:text-[#166534]"
              >
                {bank}
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={200} className="mt-8">
          <div className="flex items-center gap-3 mb-5">
            <Leaf className="h-4 w-4 text-[#16a34a]" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#16a34a]">
              Cooperativas
            </span>
            <div className="h-px flex-1 bg-green-100" />
          </div>
          <div className="flex flex-wrap gap-3">
            {COOPERATIVAS.map((coop) => (
              <div
                key={coop}
                className="rounded-lg border border-green-100 bg-green-50 px-4 py-2.5 text-sm font-medium text-[#166534] transition-colors hover:border-green-300"
              >
                {coop}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Como funciona
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-gray-500">
            Do primeiro acesso ao dossiê em mãos — quatro etapas simples e guiadas.
          </p>
        </FadeIn>

        <div className="relative mt-16">
          {/* Connector line — desktop only */}
          <div
            aria-hidden
            className="absolute left-[12.5%] right-[12.5%] top-[23px] hidden h-px bg-gradient-to-r from-transparent via-green-200 to-transparent lg:block"
          />

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((step, i) => (
              <FadeIn key={step.title} delay={i * 100}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#166534] text-base font-bold text-white ring-8 ring-white">
                    {i + 1}
                  </div>
                  <step.icon className="mb-3 h-6 w-6 text-[#16a34a]" />
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {step.title}
                  </p>
                  <h3 className="mb-2 text-base font-bold text-gray-900">{step.subtitle}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{step.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Benefits() {
  return (
    <section id="beneficios" className="border-t border-gray-100 bg-[#f9fafb] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Por que usar o AgroBridge?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-gray-500">
            Cada funcionalidade foi desenhada com o olhar de quem já analisou centenas de dossiês de crédito rural.
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit, i) => (
            <FadeIn key={benefit.title} delay={Math.floor(i / 3) * 100 + (i % 3) * 60}>
              <Card className="flex flex-col gap-3 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <benefit.icon className="h-5 w-5 text-[#166534]" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{benefit.description}</p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function SocialProof() {
  return (
    <section className="bg-[#14532d] px-6 py-28 text-white">
      <FadeIn className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full border border-green-700 bg-green-900/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-green-300">
          Conhecimento bancário + Inteligência Artificial
        </span>
        <h2 className="mt-8 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Criado por quem conhece
          <br />o banco por dentro
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-green-200">
          Desenvolvido com base no MCR e na experiência real de análise de crédito rural.
          Cada etapa foi desenhada para eliminar os motivos mais comuns de reprovação documental.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-green-300">
          {["Baseado no MCR", "Testado com bancários", "LGPD compliant"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#16a34a]" />
              {item}
            </span>
          ))}
        </div>
      </FadeIn>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="bg-[#166534] px-6 py-28 text-white">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Seu dossiê aprovado
          <br />começa aqui
        </h2>
        <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-green-100">
          Independente do resultado, você terá o processo mais
          organizado que um banco já recebeu.
        </p>
        <Link
          href="/cadastro"
          className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-[#166534] transition-colors hover:bg-green-50"
        >
          Começar agora
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <p className="mt-5 text-sm text-green-300">Gratuito para começar. Sem cartão de crédito.</p>
      </FadeIn>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo />
        <p className="text-xs text-gray-400">
          AgroBridge © {YEAR} — Crédito rural simplificado
        </p>
        <div className="flex gap-6 text-xs text-gray-400">
          <Link href="/privacidade" className="transition-colors hover:text-gray-700">
            Privacidade
          </Link>
          <Link href="/termos" className="transition-colors hover:text-gray-700">
            Termos
          </Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Shared ──────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link href="/" className="text-lg font-black tracking-tight">
      <span className="text-[#166534]">Agro</span>
      <span className="text-gray-900">Bridge</span>
    </Link>
  )
}
