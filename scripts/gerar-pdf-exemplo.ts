#!/usr/bin/env tsx
/**
 * Gera um PDF de exemplo em docs/examples/ pra Paulo avaliar o
 * visual atual (baseline pré-redesign Fase 2).
 *
 * Dados e parecer são MOCKADOS (lead fictício). Não chama Anthropic
 * nem Supabase — gera em segundos, zero custo.
 *
 * Uso:
 *   npx tsx scripts/gerar-pdf-exemplo.ts
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { montarViabilidadePDF } from '../lib/dossie/pdf-viabilidade'
import type { PerfilEntrevista } from '../types/entrevista'

const produtor = {
  nome: 'Paulo Rodrigues dos Santos',
  cpf: '123.456.789-00',
  email: 'paulo.rodrigues@exemplo.com',
}

// Shape livre — o template só lê campos específicos e trata o resto
// como contexto. Mock realista pra ver o visual renderizado.
const perfil = {
  perfil: {
    nome: 'Paulo Rodrigues dos Santos',
    cpf: '123.456.789-00',
    telefone: '(65) 99999-0000',
    municipio: 'Sorriso',
    estado: 'MT',
  },
  operacao: {
    fazenda_nome: 'Fazenda Santa Elisa',
    area_ha: 420,
    cultura_principal: 'soja',
    relacao_terra: 'proprio',
  },
  credito: {
    finalidade: 'custeio',
    valor_pretendido: 1_250_000,
    prazo_meses: 12,
  },
  financeiro: {
    endividamento_pct: 45,
    reciprocidade: 'media',
    historico_scr: 'limpo',
    garantias: ['hipoteca_1grau', 'cedula_produto_rural'],
  },
  documentos: {
    car: 'regular_averbado',
    itr_em_dia: true,
    ir_em_dia: true,
    cpf_cnpj_regular: true,
    inventario: false,
    tem_seguro_agricola: true,
  },
} as unknown as PerfilEntrevista

const parecerMd = `## Diagnóstico

Produtor proprietário de 420 ha em Sorriso/MT, com operação consolidada em soja e histórico bancário limpo. A combinação de área produtiva própria + garantia real disponível + documentação ambiental regularizada (CAR averbado, ITR em dia) joga fortemente a favor. O endividamento em torno de 45% da receita anual estimada fica dentro do patamar confortável pro limite operacional que o banco avalia nesse porte.

**Probabilidade em condições favoráveis: alta**, sujeita a análise de comitê e conjuntura vigente do Plano Safra.

## Linha MCR provável

A linha compatível com o perfil apresentado é o **Pronamp Custeio** — voltado a produtores médios até R$ 3 milhões de renda bruta anual, com teto de R$ 2,1 milhões por mutuário e taxa estimada na faixa de **9,5% a 11,5% a.a.** (sujeito às condições do credor vigentes em 2026). O valor pretendido de R$ 1.250.000,00 se encaixa confortavelmente dentro do teto.

Alternativamente, se a renda bruta ultrapassar R$ 3 milhões/ano, a operação migra pra **Custeio de Mercado (Recursos Livres)** com taxa um pouco acima mas prazo e estrutura semelhantes.

## Comportamento típico do credor alvo

Bancos médios e cooperativas regionais, no recorte de produtor consolidado com garantia real, historicamente conduzem a análise com foco em três vetores: **regularidade ambiental** (CAR averbado já te coloca no grupo "pronto pra dossiê"), **capacidade de pagamento demonstrada** (o IR dos últimos 2 exercícios + safra anterior são os documentos que o comitê realmente lê) e **liquidez da garantia** (hipoteca de 1º grau sobre imóvel rural com matrícula regular é bem aceita; cédula de produto rural é usada como reforço, não isolada).

Ponto de atenção principal: o comitê tende a pedir **projeto técnico assinado por agrônomo + croqui atualizado + estudo de limites** mesmo em operações de custeio acima de R$ 1 milhão — não é formalidade, é peça-chave da defesa.

## 3 movimentos que mais sobem sua probabilidade

- **Levantar contrato de seguro agrícola vigente (PROAGRO ou privado)** antes do pedido: remove uma das objeções clássicas do comitê de risco e, em alguns credores, libera faixa de taxa menor.
- **Atualizar matrícula do imóvel com averbação da reserva legal ≤ 90 dias antes do protocolo**: matrícula "velha" é motivo frequente de exigência, trava o tempo.
- **Organizar o registrato do Banco Central (extrato SCR) antes de entregar o dossiê**: mostra ao comitê que você conhece seu próprio endividamento, antecipa conversas sobre rolagens e evita surpresa na análise.

---

*Este parecer é uma leitura preliminar baseada nos dados autodeclarados até aqui e não constitui promessa de aprovação. A decisão final é sempre do comitê do credor.*

## Próximo passo natural pro seu caso

O próximo passo natural pro seu caso é a **consultoria particular AgroBridge (plano Ouro, R$ 697,99)**. Nela eu trabalho ao seu lado pra levantar todo o checklist documental, monto o dossiê completo em PDF com histórico, defesa técnica, registrato e prova de não-restrição, e cuido dos pontos sensíveis que o banco pesquisa mas raramente comenta — risco de imagem, PEP, mídia negativa, processos, embargos ambientais. Quando o banco chamar pra comitê, você entra preparado. Se precisar de projetista, agrônomo ou estudo de limites, indico pessoalmente dentro da consultoria. **Tem vagas limitadas a 6 por mês. Restam 3 vagas neste mês.**

Se não couber agora, tem dois degraus antes: o **Prata (R$ 297,99)** monta o dossiê com o checklist rural completo, mas sem mim na mesa do comitê. O **Bronze (R$ 29,99)** entrega um diagnóstico estendido e a coleta dos documentos pessoais — é a porta de entrada pra quem está amadurecendo a operação.
`

const processoId = '00000000-0000-0000-0000-000000000000'

async function main() {
  const pdf = await montarViabilidadePDF({
    produtor,
    processoId,
    perfil,
    parecerMd,
  })

  const outDir = resolve('docs/examples')
  mkdirSync(outDir, { recursive: true })
  const out = resolve(outDir, 'parecer-viabilidade-exemplo.pdf')
  writeFileSync(out, pdf)
  console.log(`\nPDF gerado: ${out}`)
  console.log(`Tamanho: ${(pdf.length / 1024).toFixed(1)} KB`)
}

main().catch((err) => {
  console.error('ERR', err)
  process.exit(2)
})
