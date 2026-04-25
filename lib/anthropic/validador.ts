import 'server-only'

// Server-only — valida documentos via Claude Sonnet (vision/pdf).
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { SONNET_MODEL } from './sonnet'

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'prompts', 'validador-system.md'),
  'utf-8'
)

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY não configurada no ambiente do servidor.')
    }
    _client = new Anthropic({ apiKey })
  }
  return _client
}

export type ValidacaoStatus = 'ok' | 'atencao' | 'invalido'

export interface ValidacaoResultado {
  status: ValidacaoStatus
  tipo_detectado: string
  confere: boolean
  resumo: string
  pendencias: string[]
  validade: 'vigente' | 'vencido' | 'sem_data_identificada'
  observacao_banco?: string
}

export interface ValidarInput {
  esperado: string // nome legível do documento (ex: "CND Federal")
  arquivo: Buffer
  mimeType: string // 'application/pdf' | 'image/jpeg' | 'image/png'
}

const MIME_IMAGEM = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function validarDocumento(input: ValidarInput): Promise<ValidacaoResultado> {
  const base64 = input.arquivo.toString('base64')

  const contentBloco: Anthropic.ContentBlockParam =
    input.mimeType === 'application/pdf'
      ? {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
        }
      : MIME_IMAGEM.has(input.mimeType)
        ? {
            type: 'image',
            source: {
              type: 'base64',
              media_type: input.mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
              data: base64,
            },
          }
        : (() => {
            throw new Error(`mimeType não suportado para validação: ${input.mimeType}`)
          })()

  const response = await getClient().messages.create({
    model: SONNET_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          contentBloco,
          {
            type: 'text',
            text: `Documento esperado: "${input.esperado}".\n\nValide e responda com o JSON especificado no system prompt. Não inclua texto fora do JSON.`,
          },
        ],
      },
    ],
  })

  const bloco = response.content[0]
  if (bloco.type !== 'text') {
    throw new Error('Resposta inesperada do validador')
  }

  // Pode vir com ```json ... ``` ou texto em volta — extrair JSON
  const match = bloco.text.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error('Validador não retornou JSON válido')
  }
  const parsed = JSON.parse(match[0]) as ValidacaoResultado

  // Sanitização defensiva
  return {
    status: (['ok', 'atencao', 'invalido'] as const).includes(parsed.status)
      ? parsed.status
      : 'atencao',
    tipo_detectado: String(parsed.tipo_detectado ?? ''),
    confere: Boolean(parsed.confere),
    resumo: String(parsed.resumo ?? ''),
    pendencias: Array.isArray(parsed.pendencias)
      ? parsed.pendencias.slice(0, 3).map(String)
      : [],
    validade: (['vigente', 'vencido', 'sem_data_identificada'] as const).includes(
      parsed.validade
    )
      ? parsed.validade
      : 'sem_data_identificada',
    observacao_banco: parsed.observacao_banco ? String(parsed.observacao_banco) : undefined,
  }
}
