// Server-only — IA v2.1: extração de fatos estruturados da última troca,
// com prompt caching (5min ephemeral) no system para baratear a 2ª
// chamada por turno (entrevista → extração).
//
// Reexporta `FatosExtraidos` e `extrairFatosDaTroca` para compatibilidade
// com o chat legado em `lib/anthropic/extrair-fatos.ts`, mas com:
//   - system em array de blocks com cache_control: ephemeral
//   - modelo dedicado (haiku 4.5)
//   - tolerância a JSON em code fence
//   - sanitização estrita de campos diretos

import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import type { PerfilLeadCamposDiretos } from '@/types/perfil-lead'

const MODEL = 'claude-haiku-4-5-20251001' as const

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY não configurada')
    _client = new Anthropic({ apiKey: key })
  }
  return _client
}

const SYSTEM_EXTRATOR = `Você é um extrator de fatos estruturados para a IA AgroBridge (consultoria em crédito rural Brasil).

Sua única tarefa: ler a última troca entre o lead e a IA e devolver UM ÚNICO JSON válido com fatos EXPLICITAMENTE confirmados pelo lead nessa troca. Não invente. Não infira. Se não foi dito, use null.

Formato EXATO (sem code fence, sem comentário, sem explicação):
{
  "campos_diretos": {
    "nome": string|null,
    "cpf": string|null,
    "telefone": string|null,
    "estado_uf": string|null,
    "municipio": string|null,
    "fazenda_nome": string|null,
    "fazenda_area_ha": number|null,
    "cultura_principal": string|null,
    "finalidade_credito": "custeio"|"investimento"|"comercializacao"|null,
    "valor_pretendido": number|null,
    "banco_alvo": string|null,
    "historico_credito": string|null
  },
  "memoria_ia_adicionar": {
    "<chave_snake_case>": "fato livre em 1 frase"
  }
}

Regras importantes:
- Campo não mencionado = null. Nunca chute.
- memoria_ia_adicionar guarda fatos que não cabem nos campos diretos (ex: irrigacao: "200 ha de pivô central"; experiencia_pronaf: "já tomou 3 vezes").
- historico_credito: resumo de 1 linha (ex: "Tomou 2 custeios no BB, último liquidado em 2024").
- fazenda_area_ha e valor_pretendido são números puros (sem "ha", sem "R$").
- NÃO devolva chaves fora deste formato.`

export interface FatosExtraidos {
  campos_diretos: Partial<Record<keyof PerfilLeadCamposDiretos, unknown>>
  memoria_ia_adicionar: Record<string, string>
}

export async function extrairFatosDaTroca(params: {
  mensagemUser: string
  respostaIA: string
}): Promise<FatosExtraidos> {
  try {
    const res = await getClient().messages.create({
      model: MODEL,
      max_tokens: 512,
      system: [
        {
          type: 'text',
          text: SYSTEM_EXTRATOR,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `LEAD: ${params.mensagemUser}\n\nIA: ${params.respostaIA}\n\nExtraia os fatos novos confirmados.`,
        },
      ],
    })
    const bloco = res.content[0]
    if (!bloco || bloco.type !== 'text') return vazio()
    return parseJsonTolerante(bloco.text)
  } catch (err) {
    console.error('[extract-facts] falhou (não fatal):', err)
    return vazio()
  }
}

function vazio(): FatosExtraidos {
  return { campos_diretos: {}, memoria_ia_adicionar: {} }
}

function parseJsonTolerante(raw: string): FatosExtraidos {
  const limpo = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
  try {
    const parsed = JSON.parse(limpo)
    if (!parsed || typeof parsed !== 'object') return vazio()
    const cd = (parsed.campos_diretos ?? {}) as Record<string, unknown>
    const mia = (parsed.memoria_ia_adicionar ?? {}) as Record<string, unknown>
    const miaClean: Record<string, string> = {}
    for (const [k, v] of Object.entries(mia)) {
      if (typeof v === 'string' && v.trim()) miaClean[k] = v.trim()
    }
    return {
      campos_diretos: sanitizarCamposDiretos(cd),
      memoria_ia_adicionar: miaClean,
    }
  } catch {
    return vazio()
  }
}

function sanitizarCamposDiretos(raw: Record<string, unknown>): FatosExtraidos['campos_diretos'] {
  const out: FatosExtraidos['campos_diretos'] = {}
  const stringFields: (keyof PerfilLeadCamposDiretos)[] = [
    'nome',
    'cpf',
    'telefone',
    'estado_uf',
    'municipio',
    'fazenda_nome',
    'cultura_principal',
    'finalidade_credito',
    'banco_alvo',
    'historico_credito',
  ]
  for (const k of stringFields) {
    const v = raw[k]
    if (typeof v === 'string' && v.trim()) out[k] = v.trim()
  }
  const numFields: (keyof PerfilLeadCamposDiretos)[] = ['fazenda_area_ha', 'valor_pretendido']
  for (const k of numFields) {
    const v = raw[k]
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[k] = v
  }
  return out
}
