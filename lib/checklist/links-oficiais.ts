// Links oficiais pra documentos do MCR.
//
// Três camadas:
//   1. Federais — URL direta do serviço (estáveis)
//   2. Estaduais — URL raiz do órgão (path do serviço muda; IA guia)
//   3. Sem emissão pública — orientação ao canal (engenheiro, cartório, etc)
//
// Se o link específico quebrar, a IA tem autorização pra pesquisar na
// web e instruir o user pelo nome do serviço no portal oficial.
// Nunca inventar URL.

export interface LinkOficial {
  label: string
  url: string
  aviso?: string
  /**
   * Hint textual pra IA quando o link direto é só raiz (estaduais).
   * Ex: "No portal, procure por 'Emissão de Certidão Negativa'".
   */
  instrucao?: string
}

export type Uf =
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO'
  | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI'
  | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO'

// ─── Mapa por UF ───────────────────────────────────────────────────
// Cada UF tem 4 portais principais que o produtor rural acessa:
//   sefaz           — CND estadual (débitos tributários)
//   oema            — licença ambiental, PRAD, TAC
//   defesa_agro     — saldo de gado, emissões veterinárias
//   junta_comercial — PJ (contrato social, certidões da junta)

interface PortaisUf {
  sefaz?: string
  oema?: string
  defesa_agro?: string
  junta_comercial?: string
}

const PORTAIS_UF: Partial<Record<Uf, PortaisUf>> = {
  GO: {
    sefaz: 'https://www.sefaz.go.gov.br/',
    oema: 'https://www.meioambiente.go.gov.br/',
    defesa_agro: 'https://www.agrodefesa.go.gov.br/',
    junta_comercial: 'https://www.juceg.go.gov.br/',
  },
  MT: {
    sefaz: 'https://www.sefaz.mt.gov.br/',
    oema: 'https://www.sema.mt.gov.br/',
    defesa_agro: 'http://www.indea.mt.gov.br/',
    junta_comercial: 'https://www.jucemat.mt.gov.br/',
  },
  MS: {
    sefaz: 'https://www.sefaz.ms.gov.br/',
    oema: 'https://www.imasul.ms.gov.br/',
    defesa_agro: 'https://www.iagro.ms.gov.br/',
    junta_comercial: 'https://www.jucems.ms.gov.br/',
  },
  MG: {
    sefaz: 'https://www.fazenda.mg.gov.br/',
    oema: 'https://www.meioambiente.mg.gov.br/',
    defesa_agro: 'https://www.ima.mg.gov.br/',
    junta_comercial: 'https://www.jucemg.mg.gov.br/',
  },
  SP: {
    sefaz: 'https://www.fazenda.sp.gov.br/',
    oema: 'https://cetesb.sp.gov.br/',
    defesa_agro: 'https://www.defesa.agricultura.sp.gov.br/',
    junta_comercial: 'https://www.jucesp.fazenda.sp.gov.br/',
  },
  PR: {
    sefaz: 'https://www.fazenda.pr.gov.br/',
    oema: 'https://www.iat.pr.gov.br/',
    defesa_agro: 'https://www.adapar.pr.gov.br/',
    junta_comercial: 'https://www.jucepar.pr.gov.br/',
  },
  RS: {
    sefaz: 'https://receita.fazenda.rs.gov.br/',
    oema: 'https://www.fepam.rs.gov.br/',
    defesa_agro: 'https://www.agricultura.rs.gov.br/',
    junta_comercial: 'https://jucisrs.rs.gov.br/',
  },
  BA: {
    sefaz: 'https://www.sefaz.ba.gov.br/',
    oema: 'http://www.inema.ba.gov.br/',
    defesa_agro: 'http://www.adab.ba.gov.br/',
    junta_comercial: 'http://www.juceb.ba.gov.br/',
  },
}

// ─── Regras federais (diretas) ─────────────────────────────────────

interface RegraFederal {
  match: RegExp
  link: LinkOficial
}

const REGRAS_FEDERAIS: RegraFederal[] = [
  {
    match: /\bcar\b|cadastro ambiental rural/i,
    link: {
      label: 'Abrir portal do SICAR',
      url: 'https://www.car.gov.br/publico/imoveis/index',
    },
  },
  {
    match: /\bccir\b|certificado.*im[oó]vel rural/i,
    link: {
      label: 'Emitir CCIR no INCRA',
      url: 'https://certificacao.incra.gov.br/csv_ccir/manterCcir.action',
    },
  },
  {
    match: /\bitr\b|imposto territorial/i,
    link: {
      label: 'Consultar ITR na Receita',
      url: 'https://servicos.receita.fazenda.gov.br/servicos/itr/default.htm',
    },
  },
  {
    match: /cnd.*ibama|certid[aã]o.*d[eé]bitos ambientais/i,
    link: {
      label: 'Emitir CND do IBAMA',
      url: 'https://servicos.ibama.gov.br/ctf/publico/certidaoNegativa/',
    },
  },
  {
    match: /registrato/i,
    link: {
      label: 'Abrir Registrato no Bacen',
      url: 'https://www.bcb.gov.br/cedadoscidadao/registrato',
    },
  },
  {
    match: /\birpf\b|imposto de renda|declara[cç][aã]o.*renda/i,
    link: {
      label: 'Meu Imposto de Renda',
      url: 'https://www.gov.br/receitafederal/pt-br/servicos/meu-imposto-de-renda',
    },
  },
  {
    match: /cnd.*federal|d[eé]bitos.*uni[aã]o|receita federal.*certid[aã]o/i,
    link: {
      label: 'Emitir CND Federal (Receita)',
      url: 'https://solucoes.receita.fazenda.gov.br/Servicos/certidaointernet/PF/Emitir',
    },
  },
  {
    match: /cnd.*fgts|fgts/i,
    link: {
      label: 'Emitir CRF do FGTS (Caixa)',
      url: 'https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf',
    },
  },
  {
    match: /cart[aã]o cnpj|cnpj.*receita/i,
    link: {
      label: 'Emitir Cartão CNPJ',
      url: 'https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Solicitacao.asp',
    },
  },
  {
    match: /matr[ií]cula.*im[oó]vel/i,
    link: {
      label: 'Pedido online (ARISP / ONR)',
      url: 'https://www.registradores.onr.org.br/',
      aviso:
        'Se o cartório não estiver integrado, vá presencialmente à comarca do imóvel.',
    },
  },
  {
    match: /certid[aã]o de casamento|registro civil/i,
    link: {
      label: 'Registro Civil online',
      url: 'https://www.registrocivil.org.br/',
    },
  },
  {
    match: /cnh|habilita[cç][aã]o/i,
    link: {
      label: 'Carteira Digital de Trânsito',
      url: 'https://portalservicos.senatran.serpro.gov.br/',
    },
  },
  // ───── Federais novos (2026-04-22) ─────
  {
    match: /cndt|certid[aã]o.*trabalhistas?|d[eé]bitos trabalhistas/i,
    link: {
      label: 'Emitir CNDT no TST',
      url: 'https://cndt-certidao.tst.jus.br/inicio.faces',
    },
  },
  {
    match: /\bcaf\b|cadastro.*agricultura familiar|sircaf/i,
    link: {
      label: 'Sistema SIRCAF (CAF)',
      url: 'https://sircaf.agricultura.gov.br/',
      aviso:
        'CAF substituiu a antiga DAP. Se nunca fez, comece pela página informativa: https://www.gov.br/mda/pt-br/cadastro-nacional-da-agricultura-familiar-caf',
    },
  },
  {
    match: /\bdap\b|declara[cç][aã]o.*aptid[aã]o.*pronaf/i,
    link: {
      label: 'DAP foi substituída pelo CAF — SIRCAF',
      url: 'https://sircaf.agricultura.gov.br/',
      aviso:
        'DAP está descontinuada. O cadastro agora é CAF no sistema SIRCAF.',
    },
  },
]

// ─── Regras estaduais (por UF) ─────────────────────────────────────
// Cada regra detecta o TIPO do documento, extrai a UF do nome (ou usa
// UF do contexto passada pela IA) e devolve o portal raiz correto.

type TipoEstadual = 'sefaz' | 'oema' | 'defesa_agro' | 'junta_comercial'

interface RegraEstadual {
  match: RegExp
  tipo: TipoEstadual
  labelBase: string
  instrucao: string
}

const REGRAS_ESTADUAIS: RegraEstadual[] = [
  {
    match: /cnd.*estadual|cnd.*sefaz|d[eé]bitos estaduais?|fazenda estadual/i,
    tipo: 'sefaz',
    labelBase: 'Emitir CND Estadual',
    instrucao:
      'No portal da SEFAZ/Receita estadual, procure por "Emissão de Certidão Negativa de Débitos". Muitas vezes aparece como "Certidão de Situação Fiscal" ou "Certidão Negativa de Tributos Estaduais".',
  },
  {
    match:
      /licen[cç]a ambiental|la[p ]|licen[cç]a.*operac|licen[cç]a.*instala|licen[cç]a.*pr[eé]via/i,
    tipo: 'oema',
    labelBase: 'Licença Ambiental',
    instrucao:
      'No portal do órgão ambiental estadual, procure por "Licenciamento Ambiental" ou "Emissão de Licença". O processo pode ser LP (prévia), LI (instalação) ou LO (operação) — consulte seu engenheiro ambiental pra saber qual se aplica.',
  },
  {
    match: /\bprad\b|recupera[cç][aã]o.*[aá]reas degradadas?/i,
    tipo: 'oema',
    labelBase: 'PRAD (Recuperação de Áreas Degradadas)',
    instrucao:
      'No portal do órgão ambiental estadual, procure por "PRAD" ou "Plano de Recuperação". Precisa ser elaborado por engenheiro florestal ou agrônomo com ART.',
  },
  {
    match: /\btac\b|termo.*ajustamento.*conduta/i,
    tipo: 'oema',
    labelBase: 'TAC (Termo de Ajustamento de Conduta)',
    instrucao:
      'TAC é firmado entre o Ministério Público / órgão ambiental estadual e o produtor. Comece pelo órgão ambiental estadual — eles te orientam se o caso vai pro MP.',
  },
  {
    match: /saldo.*gado|gta|tr[aâ]nsito.*animais?|defesa agropecu[aá]ria/i,
    tipo: 'defesa_agro',
    labelBase: 'Defesa Agropecuária',
    instrucao:
      'No portal da defesa agropecuária estadual, procure por "Saldo de Rebanho", "GTA" (Guia de Trânsito Animal) ou "Declaração de Rebanho". Nome do sistema varia: SIDAGO (GO), IAGRO (MS), INDEA (MT), CDA/GEDAVE (SP), etc.',
  },
  {
    match:
      /contrato social|junta comercial|certid[aã]o simplificada|ata.*assembleia|altera[cç][aã]o societ[aá]ria/i,
    tipo: 'junta_comercial',
    labelBase: 'Junta Comercial',
    instrucao:
      'Na Junta Comercial do estado, procure por "Emissão de Certidão Simplificada" ou "Cópia Autenticada do Contrato Social". Custo varia por estado.',
  },
]

// ─── Função principal ──────────────────────────────────────────────

/**
 * Retorna o link oficial pra um documento, opcionalmente contextualizado
 * por UF. Se for federal, devolve URL direta. Se for estadual e tiver UF,
 * devolve URL raiz do órgão + instrução pra IA guiar. Se não encontrar,
 * devolve null (IA vai usar busca web).
 */
export function linkOficialPara(
  nomeDocumento: string,
  uf?: Uf | string | null,
): LinkOficial | null {
  // 1. Tenta federal primeiro
  for (const regra of REGRAS_FEDERAIS) {
    if (regra.match.test(nomeDocumento)) return regra.link
  }

  // 2. Tenta estadual
  for (const regra of REGRAS_ESTADUAIS) {
    if (!regra.match.test(nomeDocumento)) continue

    const ufNorm = normalizarUf(uf)
    if (!ufNorm) {
      // Achou o tipo, mas não sabemos a UF — devolve instrução genérica
      return {
        label: `${regra.labelBase} (estadual)`,
        url: '',
        instrucao:
          regra.instrucao +
          ' Se souber a UF do produtor, posso apontar o portal específico.',
        aviso:
          'UF não identificada — a IA deve perguntar ao produtor qual o estado da propriedade antes de enviar link.',
      }
    }

    const portais = PORTAIS_UF[ufNorm]
    if (!portais || !portais[regra.tipo]) {
      return {
        label: `${regra.labelBase} — ${ufNorm}`,
        url: '',
        instrucao:
          regra.instrucao +
          ` Para ${ufNorm}, o portal específico não está mapeado — use a busca web pra achar o órgão atual.`,
        aviso: `Portal de ${ufNorm} não mapeado internamente.`,
      }
    }

    return {
      label: `${regra.labelBase} — ${ufNorm}`,
      url: portais[regra.tipo] as string,
      instrucao: regra.instrucao,
    }
  }

  return null
}

function normalizarUf(raw: Uf | string | null | undefined): Uf | null {
  if (!raw) return null
  const up = raw.toString().trim().toUpperCase()
  if (up.length !== 2) return null
  return (up in PORTAIS_UF ? up : up) as Uf
}

/**
 * Lista de documentos do MCR que NÃO são emissão pública — IA orienta
 * o canal em vez de mandar link. Usada pelo system prompt da IA.
 */
export const DOCS_SEM_EMISSAO_PUBLICA = [
  {
    match: /projeto t[eé]cnico|projeto agron[oô]mico/i,
    canal: 'engenheiro agrônomo com ART (Anotação de Responsabilidade Técnica)',
  },
  {
    match: /croqui|memorial descritivo|georreferenciamento/i,
    canal: 'engenheiro cartográfico / agrimensor',
  },
  {
    match: /bal[aâ]n[cç]o|faturamento.*12 meses|dre|demonstrativo/i,
    canal: 'contador responsável pela empresa (PJ)',
  },
  {
    match: /laudo.*avalia[cç][aã]o|avalia[cç][aã]o.*im[oó]vel/i,
    canal: 'engenheiro agrônomo ou avaliador credenciado (ART)',
  },
] as const
