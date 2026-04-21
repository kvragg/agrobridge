import 'server-only'

// ============================================================
// Logger estruturado — server-only, JSON em uma linha
// ============================================================
// Emite logs em JSON em uma linha por entrada (formato compatível
// com Vercel Log Drains e agregadores tipo Better Stack / Datadog).
// Sem PII: aceita apenas `userId` (UUID opaco), nunca email/nome
// ou payloads de documentos.
//
// Integração futura com Sentry: `capturarErroProducao()` é o ponto
// único de captura. Quando o DSN for configurado, essa função
// também chama `Sentry.captureException`. Até lá é no-op além
// do log estruturado.
// ============================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface CampoExtra {
  [chave: string]: string | number | boolean | null | undefined
}

interface LogBase {
  nivel: LogLevel
  ts: string
  msg: string
  modulo?: string
  userId?: string | null
  requestId?: string | null
  eventId?: string | null
  duracaoMs?: number
  extra?: CampoExtra
}

// Campos que nunca podem aparecer em log estruturado — tripwire
// para enganos em code review. Se bater, coment falha-se alto.
const CAMPOS_PROIBIDOS = [
  'email',
  'senha',
  'password',
  'nome',
  'documento',
  'cpf',
  'cnpj',
  'whatsapp',
  'telefone',
  'endereco',
  'token',
  'secret',
  'apikey',
  'api_key',
]

function sanitizarExtra(extra: CampoExtra | undefined): CampoExtra | undefined {
  if (!extra) return undefined
  const limpo: CampoExtra = {}
  for (const [k, v] of Object.entries(extra)) {
    if (CAMPOS_PROIBIDOS.includes(k.toLowerCase())) {
      limpo[k] = '[redacted]'
      continue
    }
    if (typeof v === 'string' && v.length > 1000) {
      limpo[k] = v.slice(0, 1000) + '…'
      continue
    }
    limpo[k] = v
  }
  return limpo
}

function escrever(entry: LogBase): void {
  const payload = {
    ...entry,
    extra: sanitizarExtra(entry.extra),
  }
  const linha = JSON.stringify(payload)
  // Vercel já redireciona console para a camada de logs; não precisa
  // de process.stdout.write separado.
  if (entry.nivel === 'error') {
    console.error(linha)
  } else if (entry.nivel === 'warn') {
    console.warn(linha)
  } else {
    console.log(linha)
  }
}

interface LogParams {
  msg: string
  modulo?: string
  userId?: string | null
  requestId?: string | null
  eventId?: string | null
  duracaoMs?: number
  extra?: CampoExtra
}

export const logger = {
  debug(p: LogParams): void {
    if (process.env.NODE_ENV === 'production') return
    escrever({ ...p, nivel: 'debug', ts: new Date().toISOString() })
  },
  info(p: LogParams): void {
    escrever({ ...p, nivel: 'info', ts: new Date().toISOString() })
  },
  warn(p: LogParams): void {
    escrever({ ...p, nivel: 'warn', ts: new Date().toISOString() })
  },
  error(p: LogParams): void {
    escrever({ ...p, nivel: 'error', ts: new Date().toISOString() })
  },
}

// ─── Captura de erros para observabilidade ──────────────────────
// Ponto único de captura. Quando Paulo adicionar SENTRY_DSN:
//   import * as Sentry from '@sentry/nextjs'
//   Sentry.captureException(err, { extra: contexto })
// Aqui.
export function capturarErroProducao(
  err: unknown,
  contexto: {
    modulo: string
    userId?: string | null
    requestId?: string | null
    extra?: CampoExtra
  }
): void {
  const mensagem =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'erro'
  const stack = err instanceof Error ? err.stack : undefined
  logger.error({
    msg: mensagem,
    modulo: contexto.modulo,
    userId: contexto.userId ?? null,
    requestId: contexto.requestId ?? null,
    extra: {
      ...contexto.extra,
      stack: stack?.split('\n').slice(0, 8).join(' | '),
    },
  })

  // TODO(sentry): quando SENTRY_DSN configurado, enviar para Sentry aqui.
  // Mantido como placeholder intencional — a função já é o ponto certo
  // de plug, adicionar o SDK depois sem mudar call-sites.
}
