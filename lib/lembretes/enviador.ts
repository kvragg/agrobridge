import 'server-only'

// v1.1 — Frente A: enviador de lembrete + persistência em
// `lembretes_agendados`.
//
// Recebe candidatos do `detector.ts`, dispara email via Resend e
// grava log na tabela. Idempotência já garantida pelo detector
// (jaTemLembreteRecente) — aqui é só envio + persistência.

import type { SupabaseClient } from '@supabase/supabase-js'
import { enviarLembreteRetencao } from '@/lib/email/resend'
import { getEnderecosUsuario } from '@/lib/email/enderecos'
import { capturarErroProducao } from '@/lib/logger'
import type { Candidato } from './detector'

export interface ResultadoEnvio {
  user_id: string
  tipo: string
  ok: boolean
  resend_id?: string | null
  erro?: string
}

export async function enviarLembrete(
  supabase: SupabaseClient,
  candidato: Candidato,
): Promise<ResultadoEnvio> {
  // Endereço corporativo alternativo (suporte/comercial) só tem
  // sentido pra lead com acesso interno; aqui é lembrete pro lead
  // pagante, então não usamos fallback alternativo.
  const enderecos = await getEnderecosUsuario(candidato.user_id).catch(() => null)
  const emailAlternativo = enderecos?.emailAlternativo ?? null

  const result = await enviarLembreteRetencao({
    emailPrincipal: candidato.email,
    emailAlternativo,
    nome: candidato.nome,
    lembrete: {
      tipo: candidato.tipo,
      // TS narrow não passa pra union discriminada após map — cast OK
      // porque o detector garante o shape correto.
      contexto: candidato.contexto,
    } as Parameters<typeof enviarLembreteRetencao>[0]['lembrete'],
  })

  // Persiste log mesmo em caso de falha (auditoria + debug). Tabela
  // bloqueia INSERT direto; usamos service_role via supabase admin.
  const insertPayload = {
    user_id: candidato.user_id,
    tipo: candidato.tipo,
    contexto: candidato.contexto,
    email_destino: candidato.email,
    enviado_em: result.ok ? new Date().toISOString() : null,
    resend_id: result.ok ? result.resendId : null,
    envio_falhou: !result.ok,
    erro_mensagem: result.ok ? null : result.error.slice(0, 500),
  }

  const { error: insertErr } = await supabase
    .from('lembretes_agendados')
    .insert(insertPayload)

  if (insertErr) {
    capturarErroProducao(insertErr, {
      modulo: 'lembretes',
      userId: candidato.user_id,
      extra: { etapa: 'persist_log', tipo: candidato.tipo },
    })
  }

  if (result.ok) {
    return {
      user_id: candidato.user_id,
      tipo: candidato.tipo,
      ok: true,
      resend_id: result.resendId,
    }
  }

  capturarErroProducao(new Error(`lembrete_envio_falhou: ${result.error}`), {
    modulo: 'lembretes',
    userId: candidato.user_id,
    extra: { etapa: 'enviar_email', tipo: candidato.tipo, status: result.status ?? 0 },
  })
  return {
    user_id: candidato.user_id,
    tipo: candidato.tipo,
    ok: false,
    erro: result.error,
  }
}
