// GET /api/chat/mini-analise
//
// Endpoint consultável pelo frontend pra saber o estado da mini-análise do
// lead Free após ele atingir o limite de 5 turnos.
//
// Fluxo:
//   - Se já tem cache em `perfis_lead.mini_analise_texto` → retorna imediato
//   - Se não tem → dispara geração (await) e retorna quando pronta
//   - Se falhar → 503 com mensagem clara pra UI oferecer retry
//
// Pensado pra ser chamado pela ChatClient quando o gate freemium dispara,
// substituindo o antigo "Atualize a página em alguns segundos".

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { garantirMiniAnalise } from '@/lib/anthropic/garantir-mini-analise'
import { capturarErroProducao } from '@/lib/logger'
import type { PerfilLead } from '@/types/perfil-lead'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ erro: 'nao_autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: perfilRaw, error: perfilErr } = await admin
    .from('perfis_lead')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (perfilErr) {
    capturarErroProducao(perfilErr, {
      modulo: 'api/chat/mini-analise',
      userId: user.id,
      extra: { etapa: 'load_perfil' },
    })
    return Response.json(
      { erro: 'perfil_indisponivel', detalhe: 'Tenta em alguns segundos.' },
      { status: 503 },
    )
  }

  if (!perfilRaw) {
    return Response.json({
      pronta: false,
      motivo: 'perfil_nao_iniciado',
      texto: null,
      gerada_em: null,
    })
  }

  const perfil = perfilRaw as PerfilLead

  try {
    const texto = await garantirMiniAnalise(user.id, perfil)
    if (!texto) {
      return Response.json({
        pronta: false,
        motivo: 'sem_dados_suficientes',
        texto: null,
        gerada_em: null,
      })
    }
    return Response.json({
      pronta: true,
      texto,
      gerada_em: perfil.mini_analise_gerada_em ?? new Date().toISOString(),
    })
  } catch (err) {
    capturarErroProducao(err, {
      modulo: 'api/chat/mini-analise',
      userId: user.id,
      extra: { etapa: 'gerar_mini_analise' },
    })
    return Response.json(
      {
        pronta: false,
        motivo: 'falha_geracao',
        detalhe:
          'A IA teve um problema ao montar sua análise. Tente de novo em instantes.',
      },
      { status: 503 },
    )
  }
}
