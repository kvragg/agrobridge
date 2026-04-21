import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanoAtual } from '@/lib/plano'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Sparkles, ArrowRight, Download, FileText, ClipboardList, MessageCircle } from 'lucide-react'
import type { PerfilLead } from '@/types/perfil-lead'

export const dynamic = 'force-dynamic'

interface ProcessoResumo {
  id: string
  perfil_json: Record<string, unknown> | null
  pagamento_confirmado: boolean
  created_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')

  const admin = createAdminClient()

  const [{ data: perfilRaw }, plano, { data: processosRaw }] = await Promise.all([
    admin.from('perfis_lead').select('*').eq('user_id', user.id).maybeSingle(),
    getPlanoAtual(),
    admin
      .from('processos')
      .select('id, perfil_json, pagamento_confirmado, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ])

  const perfil = (perfilRaw ?? null) as PerfilLead | null
  const processos = (processosRaw ?? []) as ProcessoResumo[]
  const nomeCurto =
    (perfil?.nome?.split(' ')[0]) ??
    (user.user_metadata?.nome as string | undefined)?.split(' ')[0] ??
    'produtor'

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-gray-400">Plano atual: {plano.plano}</p>
        <h1 className="text-2xl font-black text-gray-900">
          Ola, {nomeCurto}!
        </h1>
      </header>

      <CardEstado plano={plano.plano} perfil={perfil} processos={processos} />
    </div>
  )
}

function CardEstado({
  plano,
  perfil,
  processos,
}: {
  plano: string
  perfil: PerfilLead | null
  processos: ProcessoResumo[]
}) {
  const isFree = plano === 'Free'
  const perguntas = perfil?.perguntas_respondidas_gratis ?? 0
  const miniPronta = !!perfil?.mini_analise_texto

  // 1) Free sem interagir
  if (isFree && perguntas === 0) {
    return (
      <div className="rounded-2xl border border-[#166534]/20 bg-gradient-to-br from-green-50 to-white p-6 md:p-8">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#166534]" />
          <p className="text-sm font-semibold text-[#166534]">Comece gratis</p>
        </div>
        <h2 className="text-xl font-black text-gray-900 md:text-2xl">
          Conte sua situacao. Ganhe uma analise gratuita.
        </h2>
        <p className="mt-2 max-w-xl text-sm text-gray-600 md:text-base">
          A IA AgroBridge faz 5 perguntas sobre sua operacao e devolve uma leitura tecnica personalizada
          com a linha de credito mais provavel, faixa de taxa 2026 e documentos criticos.
        </p>
        <Link
          href="/entrevista"
          className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#166534] px-6 py-3 text-base font-bold text-white transition-colors hover:bg-[#14532d]"
        >
          Falar com a IA AgroBridge
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  // 2) Free com entrevista em andamento (ainda nao chegou no gate)
  if (isFree && perguntas > 0 && perguntas < 5 && !miniPronta) {
    const restam = 5 - perguntas
    const pct = Math.round((perguntas / 5) * 100)
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
        <div className="mb-2 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-amber-700" />
          <p className="text-sm font-semibold text-amber-800">Entrevista em andamento</p>
        </div>
        <h2 className="text-lg font-black text-gray-900">
          {perguntas}/5 perguntas respondidas
        </h2>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/60">
          <div
            className="h-full rounded-full bg-[#166534] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-gray-700">
          Falta{restam === 1 ? '' : 'm'} {restam} pergunta{restam === 1 ? '' : 's'} pra voce
          receber sua analise gratuita.
        </p>
        <Link
          href="/entrevista"
          className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#166534] px-5 py-3 text-sm font-bold text-white hover:bg-[#14532d]"
        >
          Continuar entrevista
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  // 3) Free com mini-analise gerada — CTA de pagamento
  if (isFree && miniPronta) {
    const previewMax = 260
    const preview = (perfil?.mini_analise_texto ?? '').slice(0, previewMax)
    const temMais = (perfil?.mini_analise_texto?.length ?? 0) > previewMax
    return (
      <div className="rounded-2xl border border-[#166534]/20 bg-gradient-to-br from-green-50 to-white p-6 md:p-8">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#166534]" />
          <p className="text-sm font-semibold text-[#166534]">Sua analise gratuita esta pronta</p>
        </div>
        <h2 className="text-xl font-black text-gray-900">Chegou a hora do dossie completo</h2>
        <div className="mt-3 whitespace-pre-wrap rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          {preview}{temMais ? '...' : ''}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/planos"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#166534] px-5 py-3 text-sm font-bold text-white hover:bg-[#14532d]"
          >
            Quero meu dossie completo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/entrevista"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:border-[#166534] hover:text-[#166534]"
          >
            Ver analise completa
          </Link>
        </div>
      </div>
    )
  }

  // 4) Pago mas sem processo — significa que acabou de pagar ou nao criou.
  //    Processos-modelo ainda e o container da entrega (dossie).
  const processosPagos = processos.filter((p) => p.pagamento_confirmado)
  const ultimoProcesso = processosPagos[0] ?? null

  if (!ultimoProcesso) {
    return (
      <div className="rounded-2xl border border-[#166534]/20 bg-white p-6 md:p-8">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-[#166534]" />
          <p className="text-sm font-semibold text-[#166534]">Plano {plano} ativo</p>
        </div>
        <h2 className="text-xl font-black text-gray-900">Continue a entrevista com a IA</h2>
        <p className="mt-2 text-sm text-gray-600">
          Com o plano ativado, sua entrevista agora e ilimitada. Siga ate eu ter
          tudo que preciso pra montar seu dossie.
        </p>
        <Link
          href="/entrevista"
          className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#166534] px-5 py-3 text-sm font-bold text-white hover:bg-[#14532d]"
        >
          Continuar entrevista
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  const dossieGerado = typeof (ultimoProcesso.perfil_json as { _dossie_gerado_em?: string } | null)?._dossie_gerado_em === 'string'

  if (dossieGerado) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-700" />
          <p className="text-sm font-semibold text-emerald-800">Dossie pronto</p>
        </div>
        <h2 className="text-xl font-black text-gray-900">Seu dossie bancario esta disponivel</h2>
        <p className="mt-2 text-sm text-gray-600">
          O PDF com a defesa tecnica e o checklist completo foi gerado. Baixe, leve ao
          gerente e nos mandamos seu caso pro proximo passo.
        </p>
        <Link
          href={`/checklist/${ultimoProcesso.id}`}
          className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
        >
          <Download className="h-4 w-4" />
          Baixar dossie
        </Link>
      </div>
    )
  }

  // Pago mas dossie ainda nao gerado: tem checklist pendente
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-amber-700" />
        <p className="text-sm font-semibold text-amber-800">Checklist pendente</p>
      </div>
      <h2 className="text-xl font-black text-gray-900">Envie os documentos do seu checklist</h2>
      <p className="mt-2 text-sm text-gray-600">
        Com todos os documentos enviados, eu gero o dossie completo com a defesa tecnica do seu credito.
      </p>
      <Link
        href={`/checklist/${ultimoProcesso.id}`}
        className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#166534] px-5 py-3 text-sm font-bold text-white hover:bg-[#14532d]"
      >
        Ver checklist
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
