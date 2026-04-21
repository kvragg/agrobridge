import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { tierParaPlano } from '@/lib/plano'
import { PlanoBadge } from '@/components/ui/plano-badge'
import type { Tier } from '@/lib/tier'
import type { PerfilLead } from '@/types/perfil-lead'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface ProcessoRow {
  id: string
  perfil_json: Record<string, unknown> | null
  pagamento_confirmado: boolean
  created_at: string
}

interface CompraRow {
  id: string
  tier: string
  status: string
  amount_cents: number
  paid_at: string | null
  created_at: string
  provider_transaction_id: string
}

interface MensagemRow {
  id: string
  role: string
  conteudo: string
  created_at: string
}

interface AuditRow {
  id: string
  event_type: string
  created_at: string
  payload: Record<string, unknown> | null
}

export default async function AdminLeadDetalhePage({
  params,
}: {
  params: Promise<{ user_id: string }>
}) {
  const { user_id } = await params
  const admin = createAdminClient()

  const userRes = await admin.auth.admin.getUserById(user_id)
  if (!userRes.data.user) notFound()
  const u = userRes.data.user

  const [perfilRes, processosRes, comprasRes, mensagensRes, auditRes] = await Promise.all([
    admin.from('perfis_lead').select('*').eq('user_id', user_id).maybeSingle(),
    admin
      .from('processos')
      .select('id, perfil_json, pagamento_confirmado, created_at')
      .eq('user_id', user_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    admin
      .from('compras')
      .select(
        'id, tier, status, amount_cents, paid_at, created_at, provider_transaction_id'
      )
      .eq('user_id', user_id)
      .order('created_at', { ascending: false }),
    admin
      .from('mensagens')
      .select('id, role, conteudo, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true })
      .limit(100),
    admin
      .from('audit_events')
      .select('id, event_type, created_at, payload')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const perfil = (perfilRes.data ?? null) as PerfilLead | null
  const processos = (processosRes.data ?? []) as ProcessoRow[]
  const compras = (comprasRes.data ?? []) as CompraRow[]
  const mensagens = (mensagensRes.data ?? []) as MensagemRow[]
  const audit = (auditRes.data ?? []) as AuditRow[]

  let tierMax: Tier | null = null
  for (const p of processos) {
    if (!p.pagamento_confirmado) continue
    const t = (p.perfil_json as { _tier?: Tier } | null)?._tier
    if (t && (!tierMax || ordemTier(t) > ordemTier(tierMax))) tierMax = t
  }
  const plano = tierParaPlano(tierMax)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/leads"
          className="text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          ← Voltar para leads
        </Link>
        <PlanoBadge plano={plano} size="md" />
      </div>

      <section>
        <h1 className="text-2xl font-black text-gray-900">
          {perfil?.nome ?? (u.user_metadata?.nome as string | undefined) ?? 'Sem nome'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{u.email}</p>
        <p className="mt-0.5 font-mono text-xs text-gray-400">{user_id}</p>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Campo label="Telefone" valor={perfil?.telefone} />
        <Campo label="CPF" valor={perfil?.cpf} />
        <Campo label="Cadastrado em" valor={formatData(u.created_at)} />
        <Campo
          label="Localizacao"
          valor={
            perfil?.municipio && perfil?.estado_uf
              ? `${perfil.municipio}/${perfil.estado_uf}`
              : perfil?.estado_uf
          }
        />
        <Campo label="Fazenda" valor={perfil?.fazenda_nome} />
        <Campo
          label="Area"
          valor={perfil?.fazenda_area_ha ? `${perfil.fazenda_area_ha} ha` : null}
        />
        <Campo label="Cultura principal" valor={perfil?.cultura_principal} />
        <Campo label="Finalidade" valor={perfil?.finalidade_credito} />
        <Campo
          label="Valor pretendido"
          valor={
            perfil?.valor_pretendido
              ? `R$ ${perfil.valor_pretendido.toLocaleString('pt-BR')}`
              : null
          }
        />
      </section>

      {perfil?.mini_analise_texto && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Mini-analise gerada{' '}
            {perfil.mini_analise_gerada_em &&
              `em ${formatData(perfil.mini_analise_gerada_em)}`}
          </h2>
          <div className="whitespace-pre-wrap rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-800">
            {perfil.mini_analise_texto}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Compras ({compras.length})
        </h2>
        {compras.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center text-xs text-gray-400">
            Nenhuma compra registrada.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Quando</th>
                  <th className="px-3 py-2 text-left">Tier</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Valor</th>
                  <th className="px-3 py-2 text-left">TX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {compras.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">
                      {formatData(c.paid_at ?? c.created_at)}
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold">{c.tier}</td>
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
                      R$ {(c.amount_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="max-w-[12rem] truncate px-3 py-2 font-mono text-xs text-gray-500">
                      {c.provider_transaction_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Conversa ({mensagens.length})
        </h2>
        {mensagens.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center text-xs text-gray-400">
            Nenhuma mensagem trocada.
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
            {mensagens.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-green-50 text-gray-900'
                }`}
              >
                <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <span>{m.role === 'user' ? 'Lead' : 'IA'}</span>
                  <span className="font-mono">{formatData(m.created_at)}</span>
                </div>
                <div className="whitespace-pre-wrap">{m.conteudo}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Audit trail
        </h2>
        {audit.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center text-xs text-gray-400">
            Sem eventos.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Quando</th>
                  <th className="px-3 py-2 text-left">Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audit.map((a) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600">
                      {formatData(a.created_at)}
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold">{a.event_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function ordemTier(t: Tier): number {
  if (t === 'mentoria') return 3
  if (t === 'dossie') return 2
  return 1
}

function Campo({ label, valor }: { label: string; valor: string | null | undefined }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-900">
        {valor ?? <span className="text-gray-400">—</span>}
      </p>
    </div>
  )
}

function formatData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
