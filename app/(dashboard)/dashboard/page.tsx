import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ClipboardList,
  Plus,
  ArrowRight,
  FileSearch,
  MessageSquare,
  FileText,
  CreditCard,
} from 'lucide-react'
import ExcluirProcessoButton from '@/components/dashboard/ExcluirProcessoButton'

interface Processo {
  id: string
  status: string | null
  banco: string | null
  valor: number | null
  created_at: string
  perfil_json: Record<string, unknown> | null
}

interface Progresso {
  etapaAtual: number // 1..5
  etapaLabel: string
  cta: string
  href: string
  pct: number
}

const ETAPAS = [
  'Entrevista',
  'Checklist',
  'Documentos',
  'Pagamento',
  'Dossiê',
] as const

function calcularProgresso(p: Processo, docsCount: number): Progresso {
  const pj = p.perfil_json ?? {}
  const temPerfil = !!(pj as { perfil?: unknown }).perfil
  const temChecklist = typeof (pj as { _checklist_md?: string })._checklist_md === 'string'
  const pagamento = (pj as { _pagamento?: { status?: string } })._pagamento
  const pago = pagamento?.status === 'paid'
  const dossieGerado = typeof (pj as { _dossie_gerado_em?: string })._dossie_gerado_em === 'string'

  if (!temPerfil) {
    return {
      etapaAtual: 1,
      etapaLabel: 'Entrevista em andamento',
      cta: 'Retomar entrevista',
      href: `/entrevista/${p.id}`,
      pct: 10,
    }
  }
  if (!temChecklist) {
    return {
      etapaAtual: 2,
      etapaLabel: 'Gerando checklist',
      cta: 'Abrir checklist',
      href: `/checklist/${p.id}`,
      pct: 30,
    }
  }
  if (docsCount < 3) {
    return {
      etapaAtual: 3,
      etapaLabel: `${docsCount} documento${docsCount === 1 ? '' : 's'} enviado${docsCount === 1 ? '' : 's'}`,
      cta: 'Enviar documentos',
      href: `/checklist/${p.id}`,
      pct: 45 + Math.min(docsCount * 5, 15),
    }
  }
  if (!pago) {
    return {
      etapaAtual: 4,
      etapaLabel: 'Pronto para pagamento',
      cta: 'Pagar dossiê',
      href: `/checklist/${p.id}`,
      pct: 70,
    }
  }
  if (!dossieGerado) {
    return {
      etapaAtual: 5,
      etapaLabel: 'Gerar dossiê final',
      cta: 'Gerar PDF',
      href: `/checklist/${p.id}`,
      pct: 85,
    }
  }
  return {
    etapaAtual: 5,
    etapaLabel: 'Dossiê concluído',
    cta: 'Baixar dossiê',
    href: `/checklist/${p.id}`,
    pct: 100,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: processosRaw } = await supabase
    .from('processos')
    .select('id, status, banco, valor, created_at, perfil_json')
    .order('created_at', { ascending: false })

  const processos = (processosRaw ?? []) as Processo[]

  // Contar arquivos por processo (raiz + subpastas)
  const contagens: Record<string, number> = {}
  if (user) {
    for (const p of processos) {
      const prefix = `${user.id}/${p.id}`
      const { data: raiz } = await supabase.storage
        .from('documentos')
        .list(prefix, { limit: 200 })
      let count = 0
      const subpastas: string[] = []
      for (const f of raiz ?? []) {
        if (f.name === 'dossie.pdf') continue
        if (!f.metadata) {
          subpastas.push(f.name)
        } else if (f.metadata.size) {
          count += 1
        }
      }
      for (const pasta of subpastas) {
        const { data: subs } = await supabase.storage
          .from('documentos')
          .list(`${prefix}/${pasta}`, { limit: 50 })
        count += (subs ?? []).filter((f) => f.metadata?.size).length
      }
      contagens[p.id] = count
    }
  }

  const nome =
    (user?.user_metadata?.nome as string | undefined)?.split(' ')[0] ?? 'Produtor'

  const total = processos.length
  const concluidos = processos.filter(
    (p) => typeof (p.perfil_json as { _dossie_gerado_em?: string } | null)?._dossie_gerado_em === 'string'
  ).length
  const emAndamento = total - concluidos

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-400">
            {total > 0 ? 'Bem-vindo de volta' : 'Seu espaço de trabalho'}
          </p>
          <h1 className="text-2xl font-black text-gray-900">Olá, {nome}!</h1>
        </div>
        <Link
          href="/entrevista/nova"
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#166534] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#14532d] sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nova entrevista
        </Link>
      </div>

      {/* Stats */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            { label: 'Total de processos', value: total, color: 'text-gray-900' },
            { label: 'Em andamento', value: emAndamento, color: 'text-amber-600' },
            { label: 'Concluídos', value: concluidos, color: 'text-emerald-600' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-200 bg-white px-5 py-4"
            >
              <p className="text-xs font-medium text-gray-400">{stat.label}</p>
              <p className={`mt-1 text-2xl font-black ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Processos */}
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Meus processos
        </h2>

        {!processos.length ? (
          <EmptyState />
        ) : (
          <ul className="space-y-3">
            {processos.map((p) => {
              const docsCount = contagens[p.id] ?? 0
              const prog = calcularProgresso(p, docsCount)
              const descricaoCard = `${p.banco ?? 'Banco a definir'} · ${new Date(p.created_at).toLocaleDateString('pt-BR')}`
              return (
                <li key={p.id} className="relative">
                  <div className="absolute right-3 top-3 z-10">
                    <ExcluirProcessoButton processoId={p.id} descricao={descricaoCard} />
                  </div>
                  <Link
                    href={prog.href}
                    className="group block rounded-2xl border border-gray-200 bg-white p-5 pr-16 transition-all hover:border-[#166534]/30 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-50">
                        <IconePorEtapa etapa={prog.etapaAtual} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <p className="font-semibold text-gray-900">
                            {p.banco ?? 'Banco a definir'}
                          </p>
                          <p className="text-sm text-gray-400">
                            {p.valor
                              ? `R$ ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : 'valor a definir'}
                            {' · '}
                            {new Date(p.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {prog.etapaLabel}
                        </p>

                        {/* Barra de progresso */}
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-[#166534] transition-all"
                            style={{ width: `${prog.pct}%` }}
                          />
                        </div>

                        {/* Steps */}
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                          {ETAPAS.map((label, i) => {
                            const n = i + 1
                            const ativa = n === prog.etapaAtual
                            const feita = n < prog.etapaAtual || (n === 5 && prog.pct === 100)
                            return (
                              <span
                                key={label}
                                className={
                                  feita
                                    ? 'text-[#166534] font-medium'
                                    : ativa
                                      ? 'text-amber-700 font-semibold'
                                      : 'text-gray-300'
                                }
                              >
                                {feita ? '✓ ' : ''}
                                {label}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-[#166534]/10 px-3 py-1 text-xs font-semibold text-[#166534]">
                          {prog.cta}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400" />
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function IconePorEtapa({ etapa }: { etapa: number }) {
  const cls = 'h-5 w-5 text-[#166534]'
  if (etapa === 1) return <MessageSquare className={cls} />
  if (etapa === 2) return <ClipboardList className={cls} />
  if (etapa === 3) return <FileSearch className={cls} />
  if (etapa === 4) return <CreditCard className={cls} />
  return <FileText className={cls} />
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
        <ClipboardList className="h-8 w-8 text-[#166534]" />
      </div>
      <p className="text-base font-bold text-gray-700">
        Comece pela entrevista.
      </p>
      <p className="mt-1.5 max-w-sm text-sm text-gray-400">
        São 10 minutos. A IA entende seu caso, monta o checklist exato de documentos
        e prepara o pedido na linguagem que o analista do banco usa.
      </p>
      <Link
        href="/entrevista/nova"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#166534] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#14532d]"
      >
        <Plus className="h-4 w-4" />
        Começar entrevista
      </Link>
    </div>
  )
}

