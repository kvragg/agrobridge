import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanoAtual } from '@/lib/plano'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Sparkles, ArrowRight, Download, FileText, ClipboardList, MessageCircle, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react'
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
          Olá, {nomeCurto}!
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

  // 1) Free sem interagir — dor + autoridade + urgência
  if (isFree && perguntas === 0) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-[#166534]/30 bg-gradient-to-br from-green-50 via-white to-white p-6 shadow-sm md:p-8">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#166534]" />
            <p className="text-xs font-bold uppercase tracking-wider text-[#166534]">
              Análise gratuita · sem cartão
            </p>
          </div>
          <h2 className="text-2xl font-black leading-tight text-gray-900 md:text-3xl">
            Você já levou NÃO do banco por &ldquo;faltar um papel&rdquo;?
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-gray-700 md:text-base">
            90% dos pedidos de crédito rural voltam por documento fora do padrão MCR —
            matrícula desatualizada, CCIR vencido, CAR embargado, CND com pendência.
            Cada devolução é um mês a menos de safra.
          </p>

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Plano Safra 2025/26 aberto
            </p>
            <p className="mt-1 text-sm text-amber-900">
              Enquadramento abre fila por ordem de chegada. Chegar pronto no gerente é
              a diferença entre assinar o contrato agora ou esperar o próximo ciclo.
            </p>
          </div>

          <div className="mt-5 space-y-2 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]" />
              <span>
                <strong>IA treinada no MCR</strong> (Manual de Crédito Rural do Bacen) —
                lê sua situação e aponta a linha mais provável e a faixa de taxa 2025/26.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]" />
              <span>
                <strong>Checklist 100% enquadrado no MCR</strong>, com links oficiais
                (INCRA, SICAR, Receita, Fazenda, Prefeitura) — sem chute.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]" />
              <span>
                <strong>Defesa técnica</strong> construída por quem esteve do lado do
                comitê de crédito — a mesma estrutura que o Banco espera ler.
              </span>
            </div>
          </div>

          <Link
            href="/entrevista"
            className="mt-6 inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-[#166534] px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#14532d]"
          >
            Falar com a IA AgroBridge agora
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-gray-500">
            5 perguntas · resposta em menos de 2 minutos · nenhum dado compartilhado com banco.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#166534]" />
            Conformidade LGPD
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-[#166534]" />
            Dados criptografados (Supabase + RLS)
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#166534]" />
            Você controla exportação e exclusão
          </span>
        </div>
      </div>
    )
  }

  // 2) Free com entrevista em andamento (ainda não chegou no gate)
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
          Falta{restam === 1 ? '' : 'm'} {restam} pergunta{restam === 1 ? '' : 's'} pra você
          receber sua análise gratuita.
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

  // 3) Free com mini-análise gerada — CTA de pagamento
  if (isFree && miniPronta) {
    const previewMax = 260
    const preview = (perfil?.mini_analise_texto ?? '').slice(0, previewMax)
    const temMais = (perfil?.mini_analise_texto?.length ?? 0) > previewMax
    return (
      <div className="rounded-2xl border border-[#166534]/20 bg-gradient-to-br from-green-50 to-white p-6 md:p-8">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#166534]" />
          <p className="text-sm font-semibold text-[#166534]">Sua análise gratuita está pronta</p>
        </div>
        <h2 className="text-xl font-black text-gray-900">Chegou a hora do dossiê completo</h2>
        <div className="mt-3 whitespace-pre-wrap rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
          {preview}{temMais ? '...' : ''}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/planos"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#166534] px-5 py-3 text-sm font-bold text-white hover:bg-[#14532d]"
          >
            Quero meu dossiê completo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/entrevista"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:border-[#166534] hover:text-[#166534]"
          >
            Ver análise completa
          </Link>
        </div>
      </div>
    )
  }

  // 4) Pago mas sem processo — significa que acabou de pagar ou não criou.
  //    Processos-modelo ainda é o container da entrega (dossiê).
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
          Com o plano ativado, sua entrevista agora é ilimitada. Siga até eu ter
          tudo que preciso pra montar seu dossiê.
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
          <p className="text-sm font-semibold text-emerald-800">Dossiê pronto</p>
        </div>
        <h2 className="text-xl font-black text-gray-900">Seu dossiê bancário está disponível</h2>
        <p className="mt-2 text-sm text-gray-600">
          O PDF com a defesa técnica e o checklist completo foi gerado. Baixe, leve ao
          gerente e nós mandamos seu caso pro próximo passo.
        </p>
        <Link
          href={`/checklist/${ultimoProcesso.id}`}
          className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
        >
          <Download className="h-4 w-4" />
          Baixar dossiê
        </Link>
      </div>
    )
  }

  // Pago mas dossiê ainda não gerado: tem checklist pendente
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-amber-700" />
        <p className="text-sm font-semibold text-amber-800">Checklist pendente</p>
      </div>
      <h2 className="text-xl font-black text-gray-900">Envie os documentos do seu checklist</h2>
      <p className="mt-2 text-sm text-gray-600">
        Com todos os documentos enviados, eu gero o dossiê completo com a defesa técnica do seu crédito.
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
