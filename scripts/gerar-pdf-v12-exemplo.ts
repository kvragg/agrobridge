/**
 * Gera 3 PDFs v12 de exemplo (Bronze, Prata, Ouro) em `docs/examples/v12/`.
 * Use pra validar visual antes do cutover de produção.
 *
 *   npx tsx scripts/gerar-pdf-v12-exemplo.ts
 *
 * Primeiro run baixa o tarball do chromium (~50MB) — leva uns 30s.
 * Runs subsequentes usam cache local em /tmp.
 */

import fs from 'fs'
import path from 'path'
import { montarDossiePDFv12, type DossieInputV12 } from '../lib/dossie/pdf-v12'
import type { PerfilEntrevista } from '../types/entrevista'

const PERFIL_EXEMPLO: PerfilEntrevista = {
  perfil: {
    nome: 'João da Silva Costa',
    cpf: '12345678901',
    estado: 'GO',
    municipio: 'Cocalzinho de Goiás',
    tipo_pessoa: 'PF',
    atividade_principal: 'Pecuária de cria e recria',
    atividades_secundarias: ['Agricultura de soja em rotação'],
    tempo_atividade_anos: 14,
  },
  propriedade: {
    regime: 'propria',
    area_hectares: 534,
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
    faturamento_medio_anual: 2_400_000,
    faixa_faturamento: '1M_5M',
    parcelas_em_atraso: false,
    credito_rural_ativo: true,
    saldo_devedor_rural: 380_000,
  },
  necessidade_credito: {
    valor: 1_200_000,
    finalidade: 'Aquisição de matrizes Nelore PO + reforma de pastagem',
    tipo: 'investimento',
    prazo_preferido: '7 anos com 2 de carência',
    banco_preferido: '',
    linha_preferida: 'Pronamp Investimento',
  },
  pendencias: {
    sanitaria: {
      tem_pendencia: false,
      orgao: '',
      descricao: '',
    },
    ambiental: {
      tem_pendencia: false,
      orgao: '',
      descricao: '',
    },
    judicial: {
      tem_pendencia: false,
      descricao: '',
    },
  },
  alertas: [],
  observacoes_livres:
    'Operação consolidada, plantel próprio, foco em descarte de matrizes Nelore.',
}

const LAUDO_MD_EXEMPLO = `## Aderência ao MCR

A operação de **investimento** pleiteada por João da Silva Costa em Cocalzinho de Goiás-GO se enquadra adequadamente na linha **Pronamp Investimento**, considerando o porte da propriedade (534 ha) e o faturamento anual médio de R$ 2,4 milhões.

A propriedade está sob regime de domínio pleno, com matrícula em nome do produtor e CAR ativo — três pontos que comitês olham primeiro e estão favoravelmente posicionados neste pleito.

## Capacidade de pagamento

O faturamento médio anual de **R$ 2,4 milhões** com endividamento ativo declarado de R$ 380 mil (cerca de 16% da receita) indica capacidade de pagamento confortável. O serviço da nova dívida, considerando prazo de 7 anos com 2 de carência, deve consumir aproximadamente 12-15% do fluxo bruto anual.

- Faturamento médio anual: R$ 2,4 milhões
- Endividamento atual: R$ 380 mil (16% da receita)
- Capacidade adicional estimada: até R$ 600 mil/ano em serviço de dívida
- Margem operacional: compatível com expansão do plantel

## Estrutura de garantia recomendada

Considerando a **hierarquia de garantias preferidas pelo mercado em 2026** (cenário de Selic alta e onda de RJs no agro), recomenda-se:

1. **Alienação fiduciária** sobre o imóvel rural — execução extrajudicial, modalidade preferida em 2026
2. Complementar com **investimento dado em garantia** se houver folga financeira (CDB/LCA vinculado)
3. Aval do cônjuge como reforço institucional

## Pontos a tratar antes do protocolo

- Confirmar atualização cadastral no banco-alvo (renda real + patrimônio em valor de mercado)
- CND Municipal pendente — emitir antes da formalização
- Atualizar saldo de animais junto à AGRODEFESA-GO se houver mudança recente

## Recomendação final

Operação **viável** com lastro patrimonial confortável, regularidade documental verificada e capacidade de pagamento comprovada por fluxo recorrente. Apresentação ao comitê com garantia estruturada (alienação fiduciária) tende a ter alta aceitação no cenário 2026.
`

async function gerar(tier: 'diagnostico' | 'dossie' | 'mentoria') {
  console.log(`Gerando v12 ${tier}...`)
  const input: DossieInputV12 = {
    produtor: { nome: PERFIL_EXEMPLO.perfil.nome, cpf: PERFIL_EXEMPLO.perfil.cpf },
    processoId: 'a3f5c1d2-e4b6-7890-abcd-ef0123456789',
    banco: null,
    valor: PERFIL_EXEMPLO.necessidade_credito.valor,
    perfil: PERFIL_EXEMPLO,
    laudoMd: LAUDO_MD_EXEMPLO,
    tier,
  }
  const t0 = Date.now()
  const buffer = await montarDossiePDFv12(input)
  const ms = Date.now() - t0
  const outDir = path.join(process.cwd(), 'docs/examples/v12')
  fs.mkdirSync(outDir, { recursive: true })
  const file = path.join(outDir, `${tier}.pdf`)
  fs.writeFileSync(file, buffer)
  console.log(`  ✓ ${file} (${(buffer.length / 1024).toFixed(1)} KB · ${ms}ms)`)
}

async function main() {
  await gerar('diagnostico')
  await gerar('dossie')
  await gerar('mentoria')
  console.log('\nFeito. Abra os PDFs em docs/examples/v12/ pra validação visual.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Erro ao gerar PDFs:', err)
  process.exit(1)
})
