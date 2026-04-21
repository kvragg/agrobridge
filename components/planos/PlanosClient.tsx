'use client'

import Link from 'next/link'
import {
  Check,
  Zap,
  FileText,
  UserCheck,
  Shield,
  Clock,
  ArrowRight,
} from 'lucide-react'

// URLs Cakto — checkout externo, redirect (não iframe).
// Cakto propaga `?ref=<processo_id>` da URL para o webhook (modo (ii) do plano).
// Fallback para lookup-por-email no webhook caso não propague.
const CAKTO_DIAGNOSTICO = 'https://pay.cakto.com.br/wwdtenz_857137'
const CAKTO_DOSSIE = 'https://pay.cakto.com.br/t4ajfpf_857143'
const CAKTO_MENTORIA = 'https://pay.cakto.com.br/efia2s6_857148'

function comRef(url: string, processoId: string): string {
  if (!url) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}ref=${encodeURIComponent(processoId)}`
}

interface Feature {
  text: string
  destaque?: boolean
}

interface Plano {
  id: 'diagnostico' | 'dossie' | 'mentoria'
  nome: string
  tagline: string
  preco: string
  precoSub: string
  icone: React.ReactNode
  features: Feature[]
  cta: string
  href: string
  destaque?: boolean
  badge?: string
}

const PLANOS: Plano[] = [
  {
    id: 'diagnostico',
    nome: 'Diagnóstico Rápido',
    tagline: 'Pra chegar na agência sabendo o que falar.',
    preco: 'R$ 29,99',
    precoSub: 'pagamento único',
    icone: <Zap className="h-6 w-6" />,
    features: [
      { text: 'Liberação imediata da IA para entrevista técnica' },
      { text: 'PDF tático de posicionamento bancário' },
      { text: 'Roteiro do que dizer — e do que NÃO falar — ao gerente' },
      { text: 'Leitura crítica do seu perfil em linguagem de comitê' },
    ],
    cta: 'Quero o diagnóstico rápido',
    href: CAKTO_DIAGNOSTICO,
  },
  {
    id: 'dossie',
    nome: 'Dossiê Bancário Completo',
    tagline: 'O pedido pronto pra sentar na mesa do comitê.',
    preco: 'R$ 297,99',
    precoSub: 'pagamento único',
    icone: <FileText className="h-6 w-6" />,
    destaque: true,
    badge: 'MAIS VENDIDO',
    features: [
      { text: 'Tudo do Diagnóstico Rápido', destaque: true },
      { text: 'Dossiê Bancário profissional em PDF' },
      { text: 'Sumário executivo e checklist 100% ordenado' },
      { text: 'Documentos anexados no padrão do banco' },
      { text: 'Defesa de Crédito em linguagem de comitê' },
      { text: 'Roteiro de Visita Técnica do analista na fazenda' },
    ],
    cta: 'Quero o dossiê completo',
    href: CAKTO_DOSSIE,
  },
  {
    id: 'mentoria',
    nome: 'Acesso à Mesa de Crédito',
    tagline: 'Revisão cirúrgica com quem sentava na mesa.',
    preco: 'R$ 697,99',
    precoSub: 'pagamento único',
    icone: <UserCheck className="h-6 w-6" />,
    features: [
      { text: 'Tudo do Dossiê Completo', destaque: true },
      { text: 'Consultoria pessoal e direta com o fundador' },
      { text: 'Revisão minuciosa do seu dossiê' },
      { text: 'Correção de gargalos ocultos antes do banco ver' },
      { text: 'Alinhamento de estratégia com a ótica de quem decidiu crédito por 14 anos dentro do banco' },
    ],
    cta: 'Quero a mentoria especializada',
    href: CAKTO_MENTORIA,
  },
]

export default function PlanosClient({
  nome,
  processoId,
}: {
  nome: string
  processoId: string
}) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#f9fafb]">
      {/* Header */}
      <header className="border-b border-gray-200/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-black tracking-tight">
            <span className="text-[#166534]">Agro</span>
            <span className="text-gray-900">Bridge</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-gray-500 hover:text-gray-800"
          >
            Já comprei →
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#166534]">
            Olá, {nome}. Último passo.
          </p>
          <h1 className="text-balance text-3xl font-black leading-[1.05] tracking-tight text-gray-900 sm:text-5xl">
            Escolha como você quer
            <br />
            <span className="text-[#166534]">chegar no banco.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-gray-600 sm:text-lg">
            Pagamento único, sem fidelidade. Cada nível foi desenhado por quem decidiu crédito
            por 14 anos dentro de um banco privado de grande porte — você leva o pedido pronto
            pra mesa e segue com a sua safra.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-12 grid gap-5 sm:mt-16 md:grid-cols-3 md:gap-6">
          {PLANOS.map((plano) => (
            <PlanoCard key={plano.id} plano={plano} processoId={processoId} />
          ))}
        </div>

        {/* Trust bar */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 rounded-2xl border border-gray-200 bg-white/60 p-5 sm:mt-16 sm:grid-cols-3 sm:p-6">
          <TrustItem
            icon={<Shield className="h-4 w-4" />}
            label="Pagamento seguro"
            sub="Processado por Cakto · PIX, crédito, parcelado"
          />
          <TrustItem
            icon={<Clock className="h-4 w-4" />}
            label="Acesso imediato"
            sub="Liberação automática após confirmação"
          />
          <TrustItem
            icon={<FileText className="h-4 w-4" />}
            label="Pagamento único"
            sub="Nenhuma cobrança recorrente"
          />
        </div>

        {/* Micro FAQ */}
        <div className="mx-auto mt-10 max-w-3xl text-center sm:mt-12">
          <p className="text-xs text-gray-400">
            Dúvida antes de comprar? Escreva para{' '}
            <a
              href="mailto:paulocosta.contato1@gmail.com"
              className="font-medium text-[#166534] hover:underline"
            >
              paulocosta.contato1@gmail.com
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}

function PlanoCard({
  plano,
  processoId,
}: {
  plano: Plano
  processoId: string
}) {
  const destaque = plano.destaque
  const desabilitado = !plano.href
  const href = plano.href ? comRef(plano.href, processoId) : ''

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white p-6 transition-all sm:p-7 ${
        destaque
          ? 'border-[#166534]/30 shadow-[0_20px_60px_-20px_rgba(22,101,52,0.35)] md:-translate-y-3 md:scale-[1.02]'
          : 'border-gray-200 shadow-sm hover:border-gray-300'
      }`}
    >
      {plano.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#c9a86a] to-[#b8965a] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-md">
            ★ {plano.badge}
          </span>
        </div>
      )}

      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${
          destaque ? 'bg-[#166534] text-white' : 'bg-green-50 text-[#166534]'
        }`}
      >
        {plano.icone}
      </div>

      <h3 className="text-xl font-black tracking-tight text-gray-900">
        {plano.nome}
      </h3>
      <p className="mt-1 text-sm leading-snug text-gray-500">{plano.tagline}</p>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-4xl font-black tracking-tight text-gray-900">
          {plano.preco}
        </span>
        <span className="text-xs text-gray-400">{plano.precoSub}</span>
      </div>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plano.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-snug">
            <Check
              className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                destaque ? 'text-[#166534]' : 'text-[#16a34a]'
              }`}
              strokeWidth={3}
            />
            <span
              className={
                f.destaque
                  ? 'font-semibold text-gray-900'
                  : 'text-gray-700'
              }
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {desabilitado ? (
        <button
          disabled
          className="mt-7 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-4 text-sm font-bold text-gray-400"
        >
          Checkout em configuração
        </button>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-7 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-bold transition-all ${
            destaque
              ? 'bg-[#166534] text-white shadow-lg shadow-[#166534]/20 hover:bg-[#14532d] hover:shadow-xl'
              : 'bg-gray-900 text-white hover:bg-black'
          }`}
        >
          {plano.cta}
          <ArrowRight className="h-4 w-4" />
        </a>
      )}
    </div>
  )
}

function TrustItem({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode
  label: string
  sub: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-50 text-[#166534]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-900">{label}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-gray-500">{sub}</p>
      </div>
    </div>
  )
}
