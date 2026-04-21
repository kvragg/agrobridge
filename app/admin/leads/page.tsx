import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { tierParaPlano, type PlanoComercial } from '@/lib/plano'
import { PlanoBadge } from '@/components/ui/plano-badge'
import type { Tier } from '@/lib/tier'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SearchParams {
  q?: string
  tier?: string
  uf?: string
  status?: string
  page?: string
}

interface LeadRow {
  user_id: string
  email: string
  nome: string | null
  municipio: string | null
  estado_uf: string | null
  cultura: string | null
  tier: Tier | null
  plano: PlanoComercial
  perguntas: number
  mini_pronta: boolean
  dossie_gerado: boolean
  criado_em: string
  ultima_interacao: string | null
}

const POR_PAGINA = 50

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().toLowerCase()
  const filtroTier = (sp.tier ?? '').trim()
  const filtroUf = (sp.uf ?? '').trim().toUpperCase()
  const filtroStatus = (sp.status ?? '').trim()
  const pagina = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  const admin = createAdminClient()

  const [usersRes, perfisRes, processosRes, ultimasMsgsRes] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin
      .from('perfis_lead')
      .select(
        'user_id, nome, municipio, estado_uf, cultura_principal, perguntas_respondidas_gratis, mini_analise_texto, atualizado_em'
      )
      .is('deleted_at', null),
    admin
      .from('processos')
      .select('user_id, perfil_json, pagamento_confirmado, created_at')
      .eq('pagamento_confirmado', true)
      .is('deleted_at', null),
    admin
      .from('mensagens')
      .select('user_id, created_at')
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(2000),
  ])

  const perfilPorUser = new Map<
    string,
    {
      nome: string | null
      municipio: string | null
      estado_uf: string | null
      cultura: string | null
      perguntas: number
      mini_pronta: boolean
      atualizado_em: string
    }
  >()
  for (const p of perfisRes.data ?? []) {
    perfilPorUser.set(p.user_id as string, {
      nome: (p.nome as string | null) ?? null,
      municipio: (p.municipio as string | null) ?? null,
      estado_uf: (p.estado_uf as string | null) ?? null,
      cultura: (p.cultura_principal as string | null) ?? null,
      perguntas: (p.perguntas_respondidas_gratis as number) ?? 0,
      mini_pronta: !!p.mini_analise_texto,
      atualizado_em: p.atualizado_em as string,
    })
  }

  const tierPorUser = new Map<string, Tier>()
  const dossieGeradoPorUser = new Map<string, boolean>()
  for (const pr of processosRes.data ?? []) {
    const perfilJson = pr.perfil_json as
      | { _tier?: Tier; _dossie_gerado_em?: string }
      | null
    const t = perfilJson?._tier
    if (t) {
      const atual = tierPorUser.get(pr.user_id as string)
      if (!atual || ordemTier(t) > ordemTier(atual)) {
        tierPorUser.set(pr.user_id as string, t)
      }
    }
    if (perfilJson?._dossie_gerado_em) {
      dossieGeradoPorUser.set(pr.user_id as string, true)
    }
  }

  const ultimaInteracaoPorUser = new Map<string, string>()
  for (const m of ultimasMsgsRes.data ?? []) {
    const uid = m.user_id as string | null
    if (!uid) continue
    if (!ultimaInteracaoPorUser.has(uid)) {
      ultimaInteracaoPorUser.set(uid, m.created_at as string)
    }
  }

  const leads: LeadRow[] = usersRes.data.users.map((u) => {
    const perfil = perfilPorUser.get(u.id)
    const tier = tierPorUser.get(u.id) ?? null
    const plano = tierParaPlano(tier)
    return {
      user_id: u.id,
      email: u.email ?? '—',
      nome: perfil?.nome ?? (u.user_metadata?.nome as string | undefined) ?? null,
      municipio: perfil?.municipio ?? null,
      estado_uf: perfil?.estado_uf ?? null,
      cultura: perfil?.cultura ?? null,
      tier,
      plano,
      perguntas: perfil?.perguntas ?? 0,
      mini_pronta: perfil?.mini_pronta ?? false,
      dossie_gerado: dossieGeradoPorUser.get(u.id) ?? false,
      criado_em: u.created_at,
      ultima_interacao: ultimaInteracaoPorUser.get(u.id) ?? perfil?.atualizado_em ?? null,
    }
  })

  const filtrados = leads.filter((l) => {
    if (q) {
      const alvo = `${l.nome ?? ''} ${l.email}`.toLowerCase()
      if (!alvo.includes(q)) return false
    }
    if (filtroTier) {
      if (filtroTier === 'Free' && l.tier !== null) return false
      if (filtroTier !== 'Free' && l.plano !== filtroTier) return false
    }
    if (filtroUf && (l.estado_uf ?? '').toUpperCase() !== filtroUf) return false
    if (filtroStatus) {
      if (filtroStatus === 'sem_interacao' && l.perguntas > 0) return false
      if (filtroStatus === 'entrevista_ativa' && (l.perguntas === 0 || l.mini_pronta)) return false
      if (filtroStatus === 'mini_pronta' && !l.mini_pronta) return false
      if (filtroStatus === 'dossie_gerado' && !l.dossie_gerado) return false
    }
    return true
  })

  filtrados.sort((a, b) => {
    const ta = a.ultima_interacao ?? a.criado_em
    const tb = b.ultima_interacao ?? b.criado_em
    return new Date(tb).getTime() - new Date(ta).getTime()
  })

  const totalFiltrados = filtrados.length
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrados / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const inicio = (paginaAtual - 1) * POR_PAGINA
  const pagina_ = filtrados.slice(inicio, inicio + POR_PAGINA)

  const ufsUnicas = Array.from(
    new Set(
      leads
        .map((l) => (l.estado_uf ?? '').toUpperCase())
        .filter((u) => u && u.length === 2)
    )
  ).sort()

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-black text-gray-900">Leads</h1>
        <p className="mt-1 text-sm text-gray-500">
          {leads.length} cadastrados · {totalFiltrados} filtrados
        </p>
      </section>

      <form
        method="GET"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <div className="flex-1 min-w-[220px]">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Buscar
          </label>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="nome ou email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#166534] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Plano
          </label>
          <select
            name="tier"
            defaultValue={filtroTier}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="Free">Free</option>
            <option value="Bronze">Bronze</option>
            <option value="Prata">Prata</option>
            <option value="Ouro">Ouro</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            UF
          </label>
          <select
            name="uf"
            defaultValue={filtroUf}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {ufsUnicas.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Status
          </label>
          <select
            name="status"
            defaultValue={filtroStatus}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="sem_interacao">Sem interacao</option>
            <option value="entrevista_ativa">Entrevista em andamento</option>
            <option value="mini_pronta">Mini-analise pronta</option>
            <option value="dossie_gerado">Dossie gerado</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-[#166534] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14532d]"
          >
            Filtrar
          </button>
          <Link
            href="/admin/leads"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Limpar
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Cidade/UF</th>
              <th className="px-3 py-2 text-left">Cultura</th>
              <th className="px-3 py-2 text-left">Plano</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Cadastro</th>
              <th className="px-3 py-2 text-left">Ultima interacao</th>
              <th className="px-3 py-2 text-left" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagina_.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-xs text-gray-400">
                  Nenhum lead encontrado com esses filtros.
                </td>
              </tr>
            ) : (
              pagina_.map((l) => (
                <tr key={l.user_id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs font-semibold text-gray-900">
                    {l.nome ?? <span className="text-gray-400">sem nome</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">{l.email}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {l.municipio && l.estado_uf
                      ? `${l.municipio}/${l.estado_uf}`
                      : l.estado_uf ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">{l.cultura ?? '—'}</td>
                  <td className="px-3 py-2">
                    <PlanoBadge plano={l.plano} />
                  </td>
                  <td className="px-3 py-2 text-xs">{statusLabel(l)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">
                    {formatData(l.criado_em)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">
                    {l.ultima_interacao ? formatData(l.ultima_interacao) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/leads/${l.user_id}`}
                      className="text-xs font-semibold text-[#166534] hover:underline"
                    >
                      Detalhes →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Pagina {paginaAtual} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            {paginaAtual > 1 && (
              <Link
                href={linkPagina({ ...sp, page: String(paginaAtual - 1) })}
                className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-100"
              >
                ← Anterior
              </Link>
            )}
            {paginaAtual < totalPaginas && (
              <Link
                href={linkPagina({ ...sp, page: String(paginaAtual + 1) })}
                className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-100"
              >
                Proxima →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ordemTier(t: Tier | null): number {
  if (t === 'mentoria') return 3
  if (t === 'dossie') return 2
  if (t === 'diagnostico') return 1
  return 0
}

function statusLabel(l: LeadRow): string {
  if (l.dossie_gerado) return 'Dossie pronto'
  if (l.tier) return 'Pago · sem dossie'
  if (l.mini_pronta) return 'Mini-analise pronta'
  if (l.perguntas > 0) return `Entrevista ${l.perguntas}/5`
  return 'Sem interacao'
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

function linkPagina(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) query.set(k, v)
  }
  const qs = query.toString()
  return `/admin/leads${qs ? `?${qs}` : ''}`
}
