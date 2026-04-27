import 'server-only'

// v1.1 — Frente A: detector de candidatos a lembrete.
//
// Responsabilidade única: dado um SupabaseClient (admin), retorna a
// lista de leads que devem receber cada tipo de lembrete HOJE,
// respeitando idempotência (1 do mesmo tipo a cada 7 dias por user).
//
// Não envia nada — só decide quem. Envio fica em `enviador.ts`.
//
// Heurísticas v1.1.0:
//   processo_dormente:        completude < 50% E última atividade
//                             (mensagem ou upload) > 14 dias
//   dossie_pronto_nao_baixado: dossie_entregas.status='pronto' há >24h
//                              (proxy de "não baixou": último ready_at
//                              sem mudança recente — futuro upgrade
//                              será trackear download real)

import type { SupabaseClient } from '@supabase/supabase-js'
import { calcularCompletude } from '@/lib/dossie/status'

export interface CandidatoProcessoDormente {
  tipo: 'processo_dormente'
  user_id: string
  email: string
  nome: string
  contexto: {
    processoId: string
    diasInativo: number
    docsEnviados: number
    docsTotal: number
    docsFaltando: string[]
  }
}

export interface CandidatoDossieNaoBaixado {
  tipo: 'dossie_pronto_nao_baixado'
  user_id: string
  email: string
  nome: string
  contexto: {
    processoId: string
    horasDesdeProntol: number
    tier: 'dossie' | 'mentoria'
  }
}

export type Candidato = CandidatoProcessoDormente | CandidatoDossieNaoBaixado

const JANELA_ANTI_DUPLICATE_MS = 7 * 24 * 60 * 60 * 1000
const DIAS_DORMENTE_MIN = 14
const HORAS_DOSSIE_MIN = 24

interface UserRow {
  id: string
  email: string | null
  raw_user_meta_data: Record<string, unknown> | null
}

interface ProcessoRow {
  id: string
  user_id: string
  perfil_json: Record<string, unknown> | null
  updated_at: string
}

/**
 * Identifica leads cujo checklist está <50% e ficaram >14 dias sem
 * mexer no processo (sem upload novo / sem mensagem do user).
 */
export async function detectarProcessosDormentes(
  supabase: SupabaseClient,
): Promise<CandidatoProcessoDormente[]> {
  const cutoff = new Date(Date.now() - DIAS_DORMENTE_MIN * 24 * 60 * 60 * 1000).toISOString()

  // Processos que não viraram updated_at recente E têm checklist gerado
  const { data: processos } = await supabase
    .from('processos')
    .select('id, user_id, perfil_json, updated_at')
    .is('deleted_at', null)
    .lt('updated_at', cutoff)
    .limit(500)

  const candidatos: CandidatoProcessoDormente[] = []
  for (const p of (processos ?? []) as ProcessoRow[]) {
    const perfilJson = p.perfil_json ?? {}
    const checklistMd =
      typeof perfilJson._checklist_md === 'string' ? perfilJson._checklist_md : ''
    if (!checklistMd) continue

    // Completude usa storage list — pode ser pesado em batch grande.
    // Com cap de 500 leads ativos é OK; otimizar pra v1.1.1 se preciso.
    let completude
    try {
      completude = await calcularCompletude({
        supabase,
        userId: p.user_id,
        processoId: p.id,
        checklistMd,
        perfilJson,
      })
    } catch {
      continue
    }

    const pct = completude.total > 0 ? completude.anexados / completude.total : 0
    if (pct >= 0.5) continue // 50%+ não é dormente

    if (await jaTemLembreteRecente(supabase, p.user_id, 'processo_dormente')) {
      continue
    }

    const userInfo = await fetchUserInfo(supabase, p.user_id)
    if (!userInfo?.email) continue

    const diasInativo = Math.floor(
      (Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24),
    )

    candidatos.push({
      tipo: 'processo_dormente',
      user_id: p.user_id,
      email: userInfo.email,
      nome: userInfo.nome,
      contexto: {
        processoId: p.id,
        diasInativo,
        docsEnviados: completude.anexados,
        docsTotal: completude.total,
        docsFaltando: completude.pendentes.slice(0, 5).map((d) => d.nome_esperado),
      },
    })
  }

  return candidatos
}

interface EntregaProntaRow {
  processo_id: string
  user_id: string
  ready_at: string
  tier_snapshot: 'diagnostico' | 'dossie' | 'mentoria' | null
}

/**
 * Identifica leads com dossiê pronto há >24h. Sem tracking real de
 * download ainda — proxy é "ready_at antigo" (será refinado quando
 * tivermos hit log do GET na signed URL).
 *
 * Bronze ('diagnostico') é excluído — Bronze tem viabilidade, não dossiê.
 */
export async function detectarDossiesNaoBaixados(
  supabase: SupabaseClient,
): Promise<CandidatoDossieNaoBaixado[]> {
  const cutoff = new Date(Date.now() - HORAS_DOSSIE_MIN * 60 * 60 * 1000).toISOString()

  const { data: entregas } = await supabase
    .from('dossie_entregas')
    .select('processo_id, user_id, ready_at, tier_snapshot')
    .eq('status', 'pronto')
    .lt('ready_at', cutoff)
    .is('deleted_at', null)
    .in('tier_snapshot', ['dossie', 'mentoria'])
    .limit(500)

  const candidatos: CandidatoDossieNaoBaixado[] = []
  for (const e of (entregas ?? []) as EntregaProntaRow[]) {
    if (!e.tier_snapshot || e.tier_snapshot === 'diagnostico') continue

    if (await jaTemLembreteRecente(supabase, e.user_id, 'dossie_pronto_nao_baixado')) {
      continue
    }

    const userInfo = await fetchUserInfo(supabase, e.user_id)
    if (!userInfo?.email) continue

    const horas = (Date.now() - new Date(e.ready_at).getTime()) / (1000 * 60 * 60)

    candidatos.push({
      tipo: 'dossie_pronto_nao_baixado',
      user_id: e.user_id,
      email: userInfo.email,
      nome: userInfo.nome,
      contexto: {
        processoId: e.processo_id,
        horasDesdeProntol: horas,
        tier: e.tier_snapshot,
      },
    })
  }

  return candidatos
}

// ── Helpers internos ────────────────────────────────────────────────

async function jaTemLembreteRecente(
  supabase: SupabaseClient,
  userId: string,
  tipo: string,
): Promise<boolean> {
  const since = new Date(Date.now() - JANELA_ANTI_DUPLICATE_MS).toISOString()
  const { data } = await supabase
    .from('lembretes_agendados')
    .select('id')
    .eq('user_id', userId)
    .eq('tipo', tipo)
    .gte('enviado_em', since)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle()
  return !!data
}

async function fetchUserInfo(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ email: string; nome: string } | null> {
  // perfis_lead.nome é mais confiável que metadata.
  const { data: perfil } = await supabase
    .from('perfis_lead')
    .select('nome')
    .eq('user_id', userId)
    .maybeSingle()

  // auth.admin.getUserById exige service_role — caller já é admin.
  const adminClient = supabase as unknown as {
    auth: { admin: { getUserById: (id: string) => Promise<{ data: { user: UserRow | null } }> } }
  }
  const { data } = await adminClient.auth.admin.getUserById(userId)
  if (!data?.user?.email) return null

  const nome =
    (perfil?.nome as string | undefined) ??
    (data.user.raw_user_meta_data?.nome as string | undefined) ??
    data.user.email.split('@')[0]

  return { email: data.user.email, nome }
}
