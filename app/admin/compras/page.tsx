import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ReprocessarForm } from './ReprocessarForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Compra {
  id: string
  user_id: string
  processo_id: string | null
  provider: string
  provider_transaction_id: string
  provider_product_id: string | null
  tier: string
  status: string
  amount_cents: number
  paid_at: string | null
  created_at: string
  metadata: Record<string, unknown> | null
}

interface WebhookOrfao {
  id: string
  event_id: string
  created_at: string
  payload: Record<string, unknown>
}

function formatarCentavos(c: number): string {
  return `R$ ${(c / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
  })}`
}

function formatarData(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function ComprasAdminPage() {
  const admin = createAdminClient()

  const [{ data: compras }, { data: orfasRaw }] = await Promise.all([
    admin
      .from('compras')
      .select(
        'id, user_id, processo_id, provider, provider_transaction_id, provider_product_id, tier, status, amount_cents, paid_at, created_at, metadata'
      )
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('webhook_events')
      .select('id, event_id, created_at, payload')
      .like('event_id', 'orfa_%')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const orfas: WebhookOrfao[] = (orfasRaw ?? []) as unknown as WebhookOrfao[]
  const comprasTipadas: Compra[] = (compras ?? []) as unknown as Compra[]

  return (
    <div className="space-y-10">
      <section>
        <header className="mb-4 flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Compras recentes
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Últimas 100 transações gravadas pelo webhook Cakto.
            </p>
          </div>
        </header>
        {comprasTipadas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            Nenhuma compra registrada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Criada</th>
                  <th className="px-3 py-2 text-left">Tier</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Valor</th>
                  <th className="px-3 py-2 text-left">Provider TX</th>
                  <th className="px-3 py-2 text-left">Processo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comprasTipadas.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">
                      {formatarData(c.created_at)}
                    </td>
                    <td className="px-3 py-2 font-semibold">{c.tier}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          c.status === 'paid'
                            ? 'bg-green-50 text-green-800'
                            : c.status === 'failed'
                              ? 'bg-red-50 text-red-800'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {formatarCentavos(c.amount_cents)}
                    </td>
                    <td
                      className="max-w-[12rem] truncate px-3 py-2 font-mono text-xs text-gray-500"
                      title={c.provider_transaction_id}
                    >
                      {c.provider_transaction_id}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-500">
                      {c.processo_id ? c.processo_id.slice(0, 8) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-xl font-black text-gray-900">Pagamentos órfãos</h2>
          <p className="mt-1 text-sm text-gray-500">
            Webhooks recebidos sem user identificado (email não cadastrado). Use
            o form abaixo para reprocessar manualmente após confirmar
            extrato/recibo Cakto.
          </p>
        </header>
        {orfas.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-xs text-gray-500">
            Nenhum pagamento órfão pendente.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Quando</th>
                  <th className="px-3 py-2 text-left">Email tentado</th>
                  <th className="px-3 py-2 text-left">Evento</th>
                  <th className="px-3 py-2 text-left">TX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orfas.map((o) => {
                  const p = (o.payload ?? {}) as {
                    _email?: string
                    _evento?: string
                    data?: { id?: string }
                  }
                  return (
                    <tr key={o.id}>
                      <td className="px-3 py-2 font-mono text-xs text-gray-600">
                        {formatarData(o.created_at)}
                      </td>
                      <td className="px-3 py-2 text-xs">{p._email ?? '—'}</td>
                      <td className="px-3 py-2 text-xs">{p._evento ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-500">
                        {p.data?.id ?? o.event_id}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <header className="mb-4">
          <h2 className="text-lg font-black text-amber-900">
            Reprocessar pagamento manual
          </h2>
          <p className="mt-1 text-sm text-amber-800">
            Use este form quando o user pagou mas o webhook não chegou, ou
            quando precisa dar um tier a alguém manualmente. Gera uma linha em{' '}
            <code>compras</code> e atualiza <code>_tier</code> do último
            processo aberto. Idempotente: reexecutar com mesmo{' '}
            <code>transaction_id</code> é no-op.
          </p>
        </header>
        <ReprocessarForm />
      </section>

      <p className="text-center text-xs text-gray-400">
        <Link href="/admin/compras" className="hover:underline">
          Recarregar
        </Link>
        {' · '}
        <Link href="/dashboard" className="hover:underline">
          Voltar ao painel
        </Link>
      </p>
    </div>
  )
}
