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
  Sprout,
  TrendingUp,
  Clock,
  Star,
  Zap,
} from "lucide-react"
import FadeIn from "@/components/ui/fade-in"

const STEPS = [
  {
    icon: MessageSquare,
    emoji: "💬",
    title: "Entrevista IA",
    subtitle: "Conte seu projeto em 5 minutos",
    description:
      "Responda 8 perguntas inteligentes. A IA mapeia seu perfil: tipo de produtor, finalidade do crédito e banco preferido.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: ClipboardList,
    emoji: "📋",
    title: "Checklist personalizado",
    subtitle: "Saiba exatamente o que buscar",
    description:
      "Receba a lista precisa de documentos exigidos — sem nada a mais, sem nada faltando. Ajustado ao seu banco e linha de crédito.",
    color: "bg-green-50 text-[#166534]",
  },
  {
    icon: Upload,
    emoji: "📤",
    title: "Upload e validação",
    subtitle: "A IA confere tudo por você",
    description:
      "Envie os documentos e aguarde a verificação automática de prazo, legibilidade e consistência com o MCR.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: FileText,
    emoji: "📑",
    title: "Dossiê completo",
    subtitle: "Entregue pronto ao banco",
    description:
      "PDF organizado com capa, índice, documentos validados e carta de defesa de crédito redigida pela IA.",
    color: "bg-purple-50 text-purple-600",
  },
]

const BENEFITS = [
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
  "Sicredi",
  "Sicoob",
  "Caixa Econômica",
  "BNB",
  "Bradesco",
  "Santander",
  "Safra",
]

const COOPERATIVAS = ["Sicredi", "Sicoob", "Cresol", "Unicred"]

const YEAR = new Date().getFullYear()

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <main>
        <Hero />
        <Logos />
        <HowItWorks />
        <Benefits />
        <SocialProof />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-gray-500 sm:flex">
          <a href="#como-funciona" className="transition-colors hover:text-gray-900">
            Como funciona
          </a>
          <a href="#beneficios" className="transition-colors hover:text-gray-900">
            Benefícios
          </a>
          <a href="#bancos" className="transition-colors hover:text-gray-900">
            Bancos
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-lg bg-[#166534] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#14532d] hover:shadow-md"
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
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f0fdf4] to-white px-6 pb-28 pt-20">
      {/* Background decoration */}
      <div
        aria-hidden
        className="absolute right-0 top-0 -z-10 h-[600px] w-[600px] -translate-y-1/4 translate-x-1/4 rounded-full bg-gradient-to-br from-green-100/60 to-emerald-50/40 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] -translate-x-1/4 translate-y-1/4 rounded-full bg-gradient-to-tr from-green-50/50 to-transparent blur-3xl"
      />

      <div className="mx-auto max-w-5xl text-center">
        <FadeIn>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-semibold text-[#166534] shadow-sm">
            <Zap className="h-3.5 w-3.5 text-[#16a34a]" />
            Criado por quem viveu o crédito rural por dentro
          </div>

          <h1 className="text-5xl font-black leading-[1.06] tracking-tight text-gray-950 sm:text-6xl lg:text-[72px]">
            Crédito rural sem
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 text-[#16a34a]">perder tempo</span>
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 right-0 h-3 rounded-full bg-green-200/60"
              />
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-gray-500">
            IA que entrevista, gera checklist, valida documentos e monta o
            dossiê com defesa de crédito — pronto para entregar ao banco.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/cadastro"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#166534] px-8 py-4 text-base font-bold text-white shadow-lg shadow-green-900/20 transition-all hover:bg-[#14532d] hover:shadow-xl hover:shadow-green-900/25 sm:w-auto"
            >
              Começar agora — é grátis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-8 py-4 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
            >
              Ver como funciona
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={200} className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
          {[
            { icon: ShieldCheck, label: "LGPD compliant" },
            { icon: Clock, label: "5 min para o checklist" },
            { icon: Star, label: "Baseado no MCR" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <Icon className="h-4 w-4 text-[#16a34a]" />
              {label}
            </span>
          ))}
        </FadeIn>
      </div>
    </section>
  )
}

function Logos() {
  return (
    <section id="bancos" className="border-y border-gray-100 bg-white px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Compatível com as principais instituições do agro
          </p>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="flex items-start gap-8 flex-col sm:flex-row">
            {/* Banks */}
            <div className="flex-1">
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Bancos
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {BANKS.map((bank) => (
                  <span
                    key={bank}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-600"
                  >
                    {bank}
                  </span>
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-gray-100 sm:h-auto sm:w-px sm:self-stretch" />

            {/* Cooperativas */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Leaf className="h-3.5 w-3.5 text-[#16a34a]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#16a34a]">
                  Cooperativas
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {COOPERATIVAS.map((coop) => (
                  <span
                    key={coop}
                    className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-[#166534]"
                  >
                    {coop}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16a34a]">
            Passo a passo
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Do primeiro acesso ao dossiê
          </h2>
          <p className="mx-auto mt-4 max-w-md text-gray-500">
            Quatro etapas simples e guiadas, sem precisar de contador ou despachante externo.
          </p>
        </FadeIn>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <FadeIn key={step.title} delay={i * 80}>
              <div className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                {/* Step number */}
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black ${step.color}`}
                  >
                    {step.emoji}
                  </div>
                  <span className="text-3xl font-black text-gray-100">
                    {i + 1}
                  </span>
                </div>

                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {step.title}
                </p>
                <h3 className="mb-2 text-base font-bold text-gray-900">
                  {step.subtitle}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {step.description}
                </p>

                {/* Connector arrow */}
                {i < STEPS.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block"
                  >
                    <ArrowRight className="h-5 w-5 text-gray-200" />
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function Benefits() {
  return (
    <section id="beneficios" className="bg-[#f8fafc] px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16a34a]">
            Funcionalidades
          </span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Por que usar o AgroBridge?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-gray-500">
            Cada funcionalidade foi desenhada com o olhar de quem analisou centenas de dossiês.
          </p>
        </FadeIn>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit, i) => (
            <FadeIn key={benefit.title} delay={i * 60}>
              <div className="rounded-2xl border border-white bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                  <benefit.icon className="h-5 w-5 text-[#166534]" />
                </div>
                <h3 className="mb-2 text-sm font-bold text-gray-900">
                  {benefit.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {benefit.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function SocialProof() {
  return (
    <section className="relative overflow-hidden bg-[#14532d] px-6 py-28 text-white">
      <div
        aria-hidden
        className="absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/3 rounded-full bg-[#16a34a]/10 blur-3xl"
      />
      <FadeIn className="relative mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-700/50 bg-green-900/30 px-4 py-2 text-xs font-semibold text-green-300">
          <TrendingUp className="h-3.5 w-3.5" />
          Conhecimento bancário + Inteligência Artificial
        </div>
        <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Criado por quem conhece
          <br />
          <span className="text-[#86efac]">o banco por dentro</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-green-100/80">
          Desenvolvido com base no MCR e na experiência real de análise de crédito rural.
          Cada etapa foi desenhada para eliminar os motivos mais comuns de reprovação documental.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-green-300">
          {["Baseado no MCR do Bacen", "Testado com bancários do agro", "LGPD compliant"].map(
            (item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#86efac]" />
                {item}
              </span>
            )
          )}
        </div>
      </FadeIn>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="px-6 py-28">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
          <Sprout className="h-8 w-8 text-[#166534]" />
        </div>
        <h2 className="text-4xl font-black leading-tight tracking-tight text-gray-900 sm:text-5xl">
          Seu dossiê aprovado
          <br />
          começa aqui
        </h2>
        <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-gray-500">
          Independente do resultado, você terá o processo mais organizado que um banco já recebeu.
        </p>
        <Link
          href="/cadastro"
          className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-[#166534] px-8 py-4 text-base font-bold text-white shadow-lg shadow-green-900/20 transition-all hover:bg-[#14532d] hover:shadow-xl"
        >
          Criar conta grátis
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <p className="mt-4 text-sm text-gray-400">
          Sem cartão de crédito. Sem compromisso.
        </p>
      </FadeIn>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
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

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-black tracking-tight">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#166534]">
        <Sprout className="h-4 w-4 text-white" />
      </div>
      <span>
        <span className="text-[#166534]">Agro</span>
        <span className="text-gray-900">Bridge</span>
      </span>
    </Link>
  )
}
