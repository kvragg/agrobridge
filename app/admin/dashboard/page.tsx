import { createAdminClient } from '@/lib/supabase/admin'
import { tierParaPlano } from '@/lib/plano'
import { PlanoBadge } from '@/components/ui/plano-badge'
import type { Tier } from '@/lib/tier'

export const dynamic = 'force-dynamic'
export const revalidate = 30

interface ComprasAgregado {
  tier: Tier | null
  amount_cents: number
  created_at: string
  paid_at: string | null
  status: string
}

interface TierCount {
  free: number
  bronze: number
  prata: number
  ouro: number
}

export default async function AdminDashboardPage() {
  const admin = createAdminClient()

  const [users, compras, audit] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin
      .from('compras')
      .select('tier, amount_cents, created_at, paid_at, status')
      .order('created_at', { ascending: false })
      .limit(1000),
    admin
      .from('audit_events')
      .select('event_type, created_at, target_id, user_id, payload')
      .order('created_at', { ascending: false })
      .limit(15),
  ])

  const totalLeads = users.data.users.length

  const comprasPagas = (compras.data ?? []).filter(
    (c) => c.status === 'paid'
  ) as ComprasAgregado[]

  // Tier por user: maior tier pago
  const tierPorUser = new Map<string, Tier>()
  const { data: processos } = await admin
    .from('processos')
    .select('user_id, perfil_json, pagamento_confirmado')
    .eq('pagamento_confirmado', true)
    .is('deleted_at', null)

  for (const p of processos ?? []) {
    const t = (p.perfil_json as { _tier?: Tier } | null)?._tier
    if (!t) continue
    const atual = tierPorUser.get(p.user_id)
    if (!atual || ordemTier(t) > ordemTier(atual)) tierPorUser.set(p.user_id, t)
  }

  const tierCount: TierCount = { free: 0, bronze: 0, prata: 0, ouro: 0 }
  for (const u of users.data.users) {
    const tier = tierPorUser.get(u.id) ?? null
    const plano = tierParaPlano(tier)
    if (plano === 'Free') tierCount.free += 1
    else if (plano === 'Bronze') tierCount.bronze += 1
    else if (plano === 'Prata') tierCount.prata += 1
    else tierCount.ouro += 1
  }

  const agora = new Date()
  const umDia = new Date(agora.getTime() - 24 * 60 * 60 * 1000)
  const seteDias = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)
  const trintaDias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)

  const receita = {
    dia: somar(comprasPagas, umDia),
    semana: somar(comprasPagas, seteDias),
    mes: somar(comprasPagas, trintaDias),
  }

  const ticketMedio =
    comprasPagas.length > 0
      ? comprasPagas.reduce((s, c) => s + c.amount_cents, 0) / comprasPagas.length
      : 0

  const totalPagantes = tierPorUser.size
  const conversao = totalLeads > 0 ? (totalPagantes / totalLeads) * 100 : 0

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-black text-gray-900">Visao geral</h1>
        <p className="mt-1 text-sm text-gray-500">
          Metricas operacionais em tempo quase-real (cache 30s).
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Leads por tier
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <CardContagem titulo="Free" valor={tierCount.free} plano="Free" />
          <CardContagem titulo="Bronze" valor={tierCount.bronze} plano="Bronze" />
          <CardContagem titulo="Prata" valor={tierCount.prata} plano="Prata" />
          <CardContagem titulo="Ouro" valor={tierCount.ouro} plano="Ouro" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Distribuicao
        </h2>
        <BarraHorizontal tierCount={tierCount} total={totalLeads} />
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Financeiro
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <CardMetrica titulo="Receita 24h" valor={formatCentavos(receita.dia)} />
          <CardMetrica titulo="Receita 7d" valor={formatCentavos(receita.semana)} />
          <CardMetrica titulo="Receita 30d" valor={formatCentavos(receita.mes)} />
          <CardMetrica titulo="Ticket medio" valor={formatCentavos(ticketMedio)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Conversao
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <CardMetrica titulo="Total de leads" valor={totalLeads.toString()} />
          <CardMetrica titulo="Pagantes" valor={totalPagantes.toString()} />
          <CardMetrica titulo="Taxa conversao" valor={`${conversao.toFixed(1)}%`} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Atividade recente
        </h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Quando</th>
                <th className="px-3 py-2 text-left">Evento</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Alvo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(audit.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-xs text-gray-400">
                    Sem eventos recentes
                  </td>
                </tr>
              ) : (
                (audit.data ?? []).map((e, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">
                      {formatData(e.created_at as string)}
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold">{String(e.event_type)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">
                      {e.user_id ? String(e.user_id).slice(0, 8) : '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">
                      {e.target_id ? String(e.target_id).slice(0, 20) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function ordemTier(t: Tier | null): number {
  if (t === 'mentoria') return 3
  if (t === 'dossie') return 2
  if (t === 'diagnostico') return 1
  return 0
}

function somar(compras: ComprasAgregado[], desde: Date): number {
  return compras
    .filter((c) => new Date(c.paid_at ?? c.created_at) >= desde)
    .reduce((s, c) => s + c.amount_cents, 0)
}

function formatCentavos(c: number): string {
  return `R$ ${(c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function formatData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function CardContagem({
  titulo,
  valor,
  plano,
}: {
  titulo: string
  valor: number
  plano: 'Free' | 'Bronze' | 'Prata' | 'Ouro'
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <PlanoBadge plano={plano} />
        <p className="text-xs font-medium text-gray-500">{titulo}</p>
      </div>
      <p className="mt-2 text-3xl font-black text-gray-900">{valor}</p>
    </div>
  )
}

function CardMetrica({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{titulo}</p>
      <p className="mt-1 text-2xl font-black text-gray-900">{valor}</p>
    </div>
  )
}

function BarraHorizontal({ tierCount, total }: { tierCount: TierCount; total: number }) {
  if (total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-xs text-gray-500">
        Sem leads cadastrados.
      </div>
    )
  }
  const linhas: Array<{ label: string; count: number; cor: string }> = [
    { label: 'Free', count: tierCount.free, cor: 'bg-gray-400' },
    { label: 'Bronze', count: tierCount.bronze, cor: 'bg-amber-700' },
    { label: 'Prata', count: tierCount.prata, cor: 'bg-gray-500' },
    { label: 'Ouro', count: tierCount.ouro, cor: 'bg-yellow-500' },
  ]
  return (
    <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-5">
      {linhas.map((l) => {
        const pct = total > 0 ? (l.count / total) * 100 : 0
        return (
          <div key={l.label} className="flex items-center gap-3">
            <span className="w-16 text-xs font-semibold text-gray-600">{l.label}</span>
            <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-gray-100">
              <div
                className={`flex h-full items-center justify-end pr-2 text-xs font-bold text-white ${l.cor}`}
                style={{ width: `${Math.max(pct, l.count > 0 ? 6 : 0)}%` }}
              >
                {l.count > 0 && <span>{l.count}</span>}
              </div>
            </div>
            <span className="w-14 text-right text-xs text-gray-500">{pct.toFixed(1)}%</span>
          </div>
        )
      })}
    </div>
  )
}
