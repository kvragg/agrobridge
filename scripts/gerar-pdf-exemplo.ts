#!/usr/bin/env tsx
/**
 * Gera PDFs de exemplo dos 3 tiers (Bronze · Prata · Ouro) em
 * docs/examples/ pra avaliação visual.
 *
 * Dados, parecer e laudo são MOCKADOS (lead fictício realista — produtor
 * em Cocalzinho de Goiás-GO, perfil cria/recria + grãos). Não chama
 * Anthropic nem Supabase, gera em segundos, custo zero.
 *
 * Uso:
 *   npx tsx scripts/gerar-pdf-exemplo.ts          # gera os 3
 *   npx tsx scripts/gerar-pdf-exemplo.ts bronze   # só Bronze
 *   npx tsx scripts/gerar-pdf-exemplo.ts prata    # só Prata
 *   npx tsx scripts/gerar-pdf-exemplo.ts ouro     # só Ouro
 *
 * Os PDFs ficam em docs/examples/*.pdf (gitignored — não inflar repo).
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { montarViabilidadePDF } from '../lib/dossie/pdf-viabilidade'
import { montarDossiePDF } from '../lib/dossie/pdf'
import { montarMentoriaPDF } from '../lib/dossie/pdf-mentoria'
import type { PerfilEntrevista } from '../types/entrevista'

// ── Mock realista (lead fictício) ────────────────────────────────────────

const produtor = {
  nome: 'Joaquim Mendes Vieira',
  cpf: '987.654.321-00',
  email: 'joaquim.mendes@exemplo.com',
}

const processoId = 'a3f5c1d2-9b88-4e7a-8c4f-1234567890ab'
const valor = 1_850_000

// Shape estendido — os templates leem o que conhecem e ignoram o resto.
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
  observacoes_livres:
    'Operação consolidada, complexo de 5 matrículas em Cocalzinho de Goiás-GO.',
}

// ── Conteúdos mockados dos pareceres ─────────────────────────────────────

const parecerBronze = `## Diagnóstico

Produtor proprietário de complexo rural de 1.518 ha em Cocalzinho de Goiás/GO, dedicado a pecuária de cria/recria com integração de soja em rotação, com **12 anos de atividade** e histórico bancário limpo. A documentação ambiental (CAR ativo, CCIR em dia, ITR regular) e a propriedade própria com matrícula em nome próprio combinam fortemente a favor da operação pretendida — aquisição de matrizes com custeio de pasto, valor R$ 1.850.000,00.

**Probabilidade em condições favoráveis: alta**, sujeita à análise de comitê e conjuntura vigente do Plano Safra.

## Linha MCR provável

A linha compatível com o perfil apresentado, considerando faturamento médio anual na faixa de R$ 1M a R$ 5M e operação de investimento, é o **Custeio de Mercado (Recursos Livres) com complemento via BNDES Inovagro / Moderfrota** dependendo do destino do capital. Taxa estimada na faixa de **10,5% a 13% a.a.** (sujeito às condições do credor vigentes em 2026).

## Comportamento típico do credor alvo

Bancos médios e cooperativas regionais, no recorte de produtor consolidado com pecuária + grãos e garantia real disponível, conduzem a análise com foco em três vetores: **regularidade ambiental** (CAR ativo já te coloca no grupo "pronto pra dossiê"), **demonstração de capacidade de pagamento** (IR dos últimos 2 exercícios + nota fiscal de comercialização da última safra são os documentos que o comitê realmente lê) e **liquidez da garantia** (hipoteca de 1º grau sobre imóvel rural com matrícula em nome próprio é bem aceita).

Ponto de atenção: o crédito rural ativo (saldo R$ 480.000,00) coexistindo com nova operação aciona análise de **concentração de risco safra**. Demonstrar capacidade de pagamento separada por operação é essencial.

## 3 movimentos que mais sobem sua probabilidade

- **Atualizar a CND Municipal** antes do protocolo — é o único item documental pendente e bloqueia a operação completa.
- **Anexar registrato do Banco Central (extrato SCR)** mostrando todas as operações ativas com nota explicativa de cada uma. Antecipa pergunta do comitê e demonstra organização.
- **Levantar contrato de seguro pecuário** (ou seguro Proagro pra área de soja) vigente: remove uma das objeções clássicas do comitê de risco.

---

*Este parecer é uma leitura preliminar baseada nos dados autodeclarados até aqui e não constitui promessa de aprovação. A decisão final é sempre do comitê do credor.*

## Próximo passo natural

O próximo passo natural pro seu caso é o **Dossiê Bancário Completo (plano Prata, R$ 297,99)**. Ele inclui o checklist documental personalizado com passo a passo de obtenção, a defesa técnica de crédito redigida em linguagem de comitê, o roteiro de visita técnica do analista e o PDF consolidado pronto pra entregar ao gerente.
`

const laudoPrata = `## Análise técnica geral

A operação proposta — investimento de **R$ 1.850.000,00** em aquisição de matrizes bovinas e custeio complementar de pasto — encontra lastro consistente no perfil do produtor: 12 anos de atividade rural consolidada, operação em terras próprias de **1.518 hectares** em Cocalzinho de Goiás/GO, com 5 matrículas vinculadas, todas em nome próprio. Faturamento médio anual na faixa de R$ 1M a R$ 5M, com declaração de R$ 4,2M, valida capacidade de geração de receita compatível com a alavancagem pretendida.

A relação operação/faturamento (~44%) está dentro do patamar prudencial para investimento em ativo biológico de longo ciclo, considerando que o produtor já carrega operação rural ativa de R$ 480.000,00 (relação dívida total/faturamento ~55%).

## Enquadramento na MCR

Considerando faturamento bruto anual acima de R$ 3M, a operação **não se enquadra no Pronamp** (teto de mutuário R$ 2,1M, exige faturamento ≤ R$ 3M). As linhas naturais são:

- **BNDES Inovagro** (taxa fixa, prazo até 10 anos, carência até 3) para a parcela de matrizes — limite até R$ 3M por mutuário, exige projeto técnico.
- **Custeio de Mercado (Recursos Livres)** para a parte de custeio de pasto — taxa CDI+spread, prazo curto.

## Documentação anexada

A documentação base do dossiê apresenta-se em condições de protocolo:

- **CAR ativo e regular** — registro consolidado, áreas declaradas (consolidada, RL, APP) consistentes.
- **CCIR 2025 quitado** — classificação fundiária "Grande Propriedade Produtiva", módulos fiscais 43,4 (43x acima do mínimo).
- **5 matrículas em nome próprio** — c.i.t. recente (< 90 dias), regime de bens compatível com operação direta de garantia hipotecária.
- **ITR em dia** — exercícios anteriores quitados, sem débitos.
- **CND Federal e Estadual** regulares.
- **Saldo de animais (Iagro/AgroDefesa)** com vacinas em dia (Brucelose ciclo atual, Aftosa quando aplicável).

**Pendência única**: CND Municipal — bloqueia o protocolo. Resolução em 2-5 dias úteis junto à Prefeitura de Cocalzinho de Goiás.

## Defesa técnica de crédito

### 1. Solidez patrimonial e liquidez de garantia

A garantia ofertada — hipoteca de 1º grau sobre o complexo de 1.518 hectares — apresenta **liquidez alta** no mercado regional de Cocalzinho de Goiás, área de transição cerrado/cerradão com vocação dupla (pecuária extensiva + grãos), com referencial de mercado próximo e cartório com tradição em registros de garantias rurais.

A relação **valor da garantia × valor da operação** projeta cobertura confortável (estimativa preliminar 4-6x dependendo do VTN do município), folgando além do exigido pela maioria dos produtos de investimento.

### 2. Capacidade de pagamento demonstrada

Faturamento médio anual declarado de **R$ 4,2 milhões** sustenta:

- Operação rural ativa atual (R$ 480k) — parcelas em dia
- Nova operação proposta (R$ 1,85M) com prazo 60 meses

Após nova operação, comprometimento médio de receita estimado em ~22%, dentro do patamar prudencial (≤ 30% para investimento de longo prazo).

### 3. Histórico operacional consistente

12 anos de atividade rural, sem registros de inadimplência, sem pendências judiciais ou ambientais declaradas, sem ações de execução em curso. Histórico bancário **limpo** no autodeclarado, a ser confirmado via SCR/Bacen anexo ao protocolo.

### 4. Pertinência da finalidade

Aquisição de matrizes bovinas em operação de cria/recria já estruturada (1.985 cabeças no plantel atual segundo declaração) **agrega valor produtivo direto** (incremento de bezerros desmamados/ano), com prazo compatível ao ciclo biológico. O custeio complementar de pasto sustenta a expansão sem comprometer área já produtiva.

## Roteiro de visita técnica do analista

Quando o analista visitar a propriedade, espera encontrar:

- **Cercas, currais e mangueiras** em estado funcional compatível com plantel declarado
- **Plantel visualmente coerente** com saldo Iagro/AgroDefesa (ordem de grandeza, faixas etárias)
- **Áreas de pasto formado e manejado** (sinal de capacidade de absorver matrizes adicionais)
- **Reserva legal averbada** preservada e acessível
- **Documentação física** disponível na sede pra cruzar com o dossiê

Sugestão: receber o analista com mapa da propriedade impresso, planilha do rebanho atual e cronograma resumido da expansão pretendida. Sinal forte de organização.

## Próximas etapas operacionais

- Atualizar **CND Municipal** (Prefeitura de Cocalzinho de Goiás)
- Emitir **registrato Bacen** atualizado
- Solicitar **certidão de ônus reais** atualizada das 5 matrículas (< 30 dias)
- Buscar **projeto técnico assinado por agrônomo + ART** para a parte de matrizes (exigência formal do Inovagro)
- Preparar **declaração de receita bruta** assinada (recibos de venda da última safra de bezerros + soja)

---

*Este laudo reflete análise técnica baseada nos dados autodeclarados e na documentação anexada ao processo. A decisão final de aprovação compete ao comitê do credor escolhido, em função da política vigente, conjuntura macroeconômica e percepção de risco específica da instituição.*
`

// ── Geradores ────────────────────────────────────────────────────────────

async function gerarBronze(outDir: string): Promise<void> {
  const pdf = await montarViabilidadePDF({
    produtor,
    processoId,
    perfil,
    parecerMd: parecerBronze,
  })
  const out = resolve(outDir, 'bronze-diagnostico.pdf')
  writeFileSync(out, pdf)
  console.log(`✓ Bronze gerado: ${out} (${(pdf.length / 1024).toFixed(1)} KB)`)
}

async function gerarPrata(outDir: string): Promise<void> {
  const pdf = await montarDossiePDF({
    produtor,
    processoId,
    banco: null,
    valor,
    perfil,
    laudoMd: laudoPrata,
  })
  const out = resolve(outDir, 'prata-dossie.pdf')
  writeFileSync(out, pdf)
  console.log(`✓ Prata gerado:  ${out} (${(pdf.length / 1024).toFixed(1)} KB)`)
}

async function gerarOuro(outDir: string): Promise<void> {
  const observacoesFundador = `Após revisão cirúrgica deste dossiê, três observações estratégicas que recomendo destacar na conversa com o gerente:

**1. A relação dívida total / faturamento de ~55% após a nova operação está no limite superior do confortável.** Recomendo enfatizar no comitê o ciclo biológico do investimento (matrizes geram bezerros em 18-22 meses, retorno previsível) e oferecer cronograma de amortização que comprove queda da relação a partir do mês 24.

**2. O complexo de 5 matrículas adiciona complexidade jurídica que pode ser usada a favor.** Em vez de apresentar como "bagunça documental", apresentar como "consolidação patrimonial estruturada em Goiás-MT". Banco de porte médio enxerga isso como sinal de produtor sofisticado.

**3. Faltando apenas a CND Municipal, o dossiê está em condição de protocolo imediato.** Não esperar a próxima janela mensal — protocolar assim que a CND Municipal for emitida. Quanto antes o pedido entra na fila, mais cedo entra no comitê — e o comitê de junho costuma ser o melhor pra investimentos pecuários (margem de operação anual).
`

  const pdf = await montarMentoriaPDF({
    produtor,
    processoId,
    banco: null,
    valor,
    perfil,
    laudoMd: laudoPrata,
    observacoesFundadorMd: observacoesFundador,
    numeroVaga: 3,
  })
  const out = resolve(outDir, 'ouro-mentoria.pdf')
  writeFileSync(out, pdf)
  console.log(`✓ Ouro gerado:   ${out} (${(pdf.length / 1024).toFixed(1)} KB)`)
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const arg = (process.argv[2] || 'all').toLowerCase()
  const outDir = resolve('docs/examples')
  mkdirSync(outDir, { recursive: true })

  if (arg === 'all' || arg === 'bronze') await gerarBronze(outDir)
  if (arg === 'all' || arg === 'prata') await gerarPrata(outDir)
  if (arg === 'all' || arg === 'ouro') await gerarOuro(outDir)

  console.log(`\nPasta: ${outDir}`)
}

main().catch((err) => {
  console.error('ERR', err)
  process.exit(2)
})
