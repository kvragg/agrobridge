// Server-only — 2a chamada Haiku (barata, nao-stream) que extrai fatos novos
// de uma troca recente e devolve estrutura para merge no perfil_lead.
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import type { PerfilLeadCamposDiretos } from '@/types/perfil-lead'

const MODEL = 'claude-haiku-4-5-20251001' as const

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY nao configurada')
    _client = new Anthropic({ apiKey: key })
  }
  return _client
}

const SYSTEM = `Voce e um extrator de fatos estruturados. Analise a ultima troca entre o lead e a IA AgroBridge.
Extraia APENAS fatos explicitamente confirmados (nao invente). Retorne UM UNICO JSON valido, sem explicacao, sem code fence.

Formato:
{
  "campos_diretos": {
    "nome": "Paulo" ou null,
    "cpf": "000.000.000-00" ou null,
    "telefone": "(XX) 9XXXX-XXXX" ou null,
    "estado_uf": "MT" ou null,
    "municipio": "Sorriso" ou null,
    "fazenda_nome": "Fazenda Boa Vista" ou null,
    "fazenda_area_ha": 850 ou null,
    "cultura_principal": "soja" ou null,
    "finalidade_credito": "custeio" ou null (valores: custeio, investimento, comercializacao),
    "valor_pretendido": 800000 ou null,
    "banco_alvo": "Banco do Brasil" ou null,
    "historico_credito": "resumo em 1 linha" ou null
  },
  "memoria_ia_adicionar": {
    "chave_descritiva": "fato livre em 1 frase"
  }
}

Regras:
- Se um campo nao foi mencionado na troca, use null (nunca invente).
- memoria_ia_adicionar guarda fatos que nao cabem nos campos diretos (ex: irrigacao: "200 ha de pivo central"; experiencia_pronaf: "ja tomou 3x").
- NAO devolva chaves extras fora do formato.`

export interface FatosExtraidos {
  campos_diretos: Partial<Record<keyof PerfilLeadCamposDiretos, unknown>>
  memoria_ia_adicionar: Record<string, string>
}

// Extrai fatos da ultima troca. Em caso de erro, retorna objeto vazio
// (extracao e best-effort; nao pode quebrar a conversa principal).
export async function extrairFatosDaTroca(params: {
  mensagemUser: string
  respostaIA: string
}): Promise<FatosExtraidos> {
  try {
    const res = await getClient().messages.create({
      model: MODEL,
      max_tokens: 512,
      system: SYSTEM,
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
    console.error('[extrair-fatos] falhou (nao fatal):', err)
    return vazio()
  }
}

function vazio(): FatosExtraidos {
  return { campos_diretos: {}, memoria_ia_adicionar: {} }
}

function parseJsonTolerante(raw: string): FatosExtraidos {
  // Alguns modelos envolvem o JSON em cercas ```json```. Tolera isso.
  const limpo = raw
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim()
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

// Filtra e normaliza campos diretos. Aceita apenas null ou valor compativel.
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
