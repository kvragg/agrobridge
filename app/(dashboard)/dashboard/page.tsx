import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ClipboardList,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSearch,
  MessageSquare,
} from 'lucide-react'

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  entrevista: {
    label: 'Entrevista',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    icon: MessageSquare,
  },
  checklist: {
    label: 'Checklist',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    icon: ClipboardList,
  },
  documentos: {
    label: 'Documentação',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    icon: FileSearch,
  },
  concluido: {
    label: 'Concluído',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    icon: CheckCircle2,
  },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: processos } = await supabase
    .from('processos')
    .select('id, status, banco, valor, created_at')
    .order('created_at', { ascending: false })

  const nome =
    (user?.user_metadata?.nome as string | undefined)?.split(' ')[0] ?? 'Produtor'

  const total = processos?.length ?? 0
  const concluidos = processos?.filter((p) => p.status === 'concluido').length ?? 0
  const emAndamento = total - concluidos

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-400">Bem-vindo de volta</p>
          <h1 className="text-2xl font-black text-gray-900">Olá, {nome}!</h1>
        </div>
        <Link
          href="/entrevista/nova"
          className="inline-flex items-center gap-2 rounded-xl bg-[#166534] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#14532d]"
        >
          <Plus className="h-4 w-4" />
          Nova entrevista
        </Link>
      </div>

      {/* Stats */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-4">
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

        {!processos?.length ? (
          <EmptyState />
        ) : (
          <ul className="space-y-3">
            {processos.map((p) => {
              const config =
                STATUS_CONFIG[p.status] ?? STATUS_CONFIG.entrevista
              const Icon = config.icon
              const href =
                p.status === 'entrevista'
                  ? `/entrevista/${p.id}`
                  : `/checklist/${p.id}`

              return (
                <li key={p.id}>
                  <Link
                    href={href}
                    className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-[#166534]/20 hover:shadow-sm"
                  >
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${config.bg}`}
                    >
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">
                        {p.banco ?? 'Banco a definir'}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-400">
                        {p.valor
                          ? `R$ ${p.valor.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}`
                          : 'Valor a definir'}
                        {' · '}
                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.color}`}
                      >
                        {config.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400" />
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
        <ClipboardList className="h-8 w-8 text-[#166534]" />
      </div>
      <p className="text-base font-bold text-gray-700">
        Nenhum processo iniciado
      </p>
      <p className="mt-1.5 max-w-xs text-sm text-gray-400">
        Inicie uma entrevista com a IA e receba seu checklist de crédito rural personalizado.
      </p>
      <Link
        href="/entrevista/nova"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#166534] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#14532d]"
      >
        <Plus className="h-4 w-4" />
        Iniciar agora
      </Link>
    </div>
  )
}
