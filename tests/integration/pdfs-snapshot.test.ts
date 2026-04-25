import { describe, it, expect } from 'vitest'
import { montarViabilidadePDF } from '@/lib/dossie/pdf-viabilidade'
import { montarDossiePDF } from '@/lib/dossie/pdf'
import { montarMentoriaPDF } from '@/lib/dossie/pdf-mentoria'
import type { PerfilEntrevista } from '@/types/entrevista'

// ============================================================
// [PDF1] Snapshot dos 3 templates (Bronze · Prata · Ouro)
// ============================================================
// pdfkit comprime streams de conteúdo (flate) e usa referências
// indiretas pra metadata. Parsing profundo seria custoso e frágil.
// Validamos o que IMPORTA pra detector de regressão:
//
// 1. Geração não lança exceção
// 2. Buffer começa com %PDF- (assinatura)
// 3. Tamanho dentro de range esperado (sentinela)
// 4. Page count via `/Type /Pages /Count N` (estrutura, não comprimida)
//
// Quebra desse teste = regressão em _theme/_primitives/template.
// ============================================================

const produtor = {
  nome: 'Joaquim Mendes Vieira',
  cpf: '987.654.321-00',
  email: 'joaquim@exemplo.com',
}

const processoId = 'a3f5c1d2-9b88-4e7a-8c4f-1234567890ab'
const valor = 1_850_000

const perfil: PerfilEntrevista = {
  perfil: {
    nome: produtor.nome,
    cpf: produtor.cpf,
    estado: 'GO',
    municipio: 'Cocalzinho de Goiás',
    tipo_pessoa: 'PF',
    atividade_principal: 'pecuária de cria/recria',
    atividades_secundarias: ['cultivo de soja em rotação'],
    tempo_atividade_anos: 12,
  },
  propriedade: {
    regime: 'propria',
    area_hectares: 1518,
    disponivel_como_garantia: true,
    impedimento_garantia: '',
    matricula_disponivel: true,
    matricula_em_nome_proprio: true,
    car_situacao: 'ativo',
    ccir_em_dia: true,
    itr_em_dia: true,
  },
  documentacao_pf: {
    cnd_federal: true,
    cnd_estadual: true,
    cnd_municipal: false,
    dispensa_ou_licenca_ambiental: true,
  },
  documentacao_pj: {
    contrato_social_atualizado: null,
    certidao_simplificada_junta: null,
    faturamento_12_meses_documentado: null,
    balanco_dre_disponivel: null,
  },
  financeiro: {
    faturamento_medio_anual: 4_200_000,
    faixa_faturamento: '1M_5M',
    parcelas_em_atraso: false,
    credito_rural_ativo: true,
    saldo_devedor_rural: 480_000,
  },
  necessidade_credito: {
    valor,
    finalidade: 'aquisição de matrizes + custeio de pasto',
    tipo: 'investimento',
    prazo_preferido: '60 meses',
    banco_preferido: 'a definir',
    linha_preferida: 'a definir',
  },
  pendencias: {
    sanitaria: { tem_pendencia: false, orgao: '', descricao: '' },
    ambiental: { tem_pendencia: false, orgao: '', descricao: '' },
    judicial: { tem_pendencia: false, descricao: '' },
  },
  alertas: [],
  observacoes_livres: '',
}

const parecerCurto = `## Diagnóstico

Operação consolidada com perfil de garantia favorável.

## Linha MCR provável

Custeio de mercado com complemento BNDES Inovagro.
`

const laudoCurto = `## Análise técnica geral

Operação proposta com lastro em propriedade própria de 1.518 ha.

## Defesa técnica

### Capacidade de pagamento

Faturamento R$ 4,2M sustenta a alavancagem pretendida.
`

// Ranges conservadores pra template pdf-v06 (Verde Agro Premium).
// Conteúdo dos pareceres acima é curto — quanto maior o markdown real,
// maior o PDF. Ajustar ao mudar template. Medidos em 2026-04-24:
// Bronze ~9KB (3pg), Prata ~23KB (6pg), Ouro ~32KB (8pg).
const RANGE_BRONZE = { min: 5_000, max: 25_000 }
const RANGE_PRATA = { min: 12_000, max: 60_000 }
const RANGE_OURO = { min: 18_000, max: 80_000 }

function eValidoPdf(buf: Buffer): boolean {
  return (
    Buffer.isBuffer(buf) &&
    buf.length > 0 &&
    buf.subarray(0, 5).toString('utf8') === '%PDF-'
  )
}

/** Conta páginas via metadata `/Pages` que não é comprimido em pdfkit. */
function contarPaginas(buf: Buffer): number {
  // Procura pelo objeto Pages (singular) com /Count N
  const haystack = buf.toString('latin1')
  const m = haystack.match(/\/Type\s*\/Pages\s*\/Count\s+(\d+)/)
  if (m) return parseInt(m[1], 10)
  // Fallback: conta /Type /Page (singular, não Pages) — cada página tem um
  const matches = haystack.match(/\/Type\s*\/Page\b(?!s)/g)
  return matches?.length ?? 0
}


describe('[PDF1] Bronze · Diagnóstico Rápido', () => {
  it('gera PDF válido dentro do range de tamanho esperado', async () => {
    const pdf = await montarViabilidadePDF({
      produtor,
      processoId,
      perfil,
      parecerMd: parecerCurto,
    })

    expect(eValidoPdf(pdf)).toBe(true)
    expect(pdf.length).toBeGreaterThan(RANGE_BRONZE.min)
    expect(pdf.length).toBeLessThan(RANGE_BRONZE.max)
  })

  it('gera pelo menos 1 página', async () => {
    const pdf = await montarViabilidadePDF({
      produtor,
      processoId,
      perfil,
      parecerMd: parecerCurto,
    })

    expect(contarPaginas(pdf)).toBeGreaterThanOrEqual(1)
  })
})

describe('[PDF2] Prata · Dossiê Bancário Completo', () => {
  it('gera PDF válido dentro do range esperado', async () => {
    const pdf = await montarDossiePDF({
      produtor,
      processoId,
      banco: null,
      valor,
      perfil,
      laudoMd: laudoCurto,
    })

    expect(eValidoPdf(pdf)).toBe(true)
    expect(pdf.length).toBeGreaterThan(RANGE_PRATA.min)
    expect(pdf.length).toBeLessThan(RANGE_PRATA.max)
  })

  it('gera múltiplas páginas (capa + seções)', async () => {
    const pdf = await montarDossiePDF({
      produtor,
      processoId,
      banco: null,
      valor,
      perfil,
      laudoMd: laudoCurto,
    })

    expect(contarPaginas(pdf)).toBeGreaterThanOrEqual(3)
  })

})

describe('[PDF3] Ouro · Assessoria Premium 1:1 (Mentoria)', () => {
  it('gera PDF válido dentro do range esperado', async () => {
    const pdf = await montarMentoriaPDF({
      produtor,
      processoId,
      banco: null,
      valor,
      perfil,
      laudoMd: laudoCurto,
      numeroVaga: 3,
    })

    expect(eValidoPdf(pdf)).toBe(true)
    expect(pdf.length).toBeGreaterThan(RANGE_OURO.min)
    expect(pdf.length).toBeLessThan(RANGE_OURO.max)
  })

  it('gera múltiplas páginas (capa + seções extras Ouro)', async () => {
    const pdf = await montarMentoriaPDF({
      produtor,
      processoId,
      banco: null,
      valor,
      perfil,
      laudoMd: laudoCurto,
      numeroVaga: 3,
    })

    // Ouro tem capa + 6 seções (II-VII) + selo final = >= 6 páginas
    expect(contarPaginas(pdf)).toBeGreaterThanOrEqual(6)
  })

  it('parecer estratégico do fundador adiciona página (vs sem observações)', async () => {
    const semParecer = await montarMentoriaPDF({
      produtor,
      processoId,
      banco: null,
      valor,
      perfil,
      laudoMd: laudoCurto,
      numeroVaga: 3,
    })

    const comParecer = await montarMentoriaPDF({
      produtor,
      processoId,
      banco: null,
      valor,
      perfil,
      laudoMd: laudoCurto,
      observacoesFundadorMd:
        '## Recomendação estratégica\n\nApresentar SCR proativamente.',
      numeroVaga: 3,
    })

    expect(contarPaginas(comParecer)).toBeGreaterThan(contarPaginas(semParecer))
  })
})
