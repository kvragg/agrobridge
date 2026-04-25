// Detecção de domínios corporativos brasileiros — usados pra:
//   1. Mostrar warning sutil no dashboard quando user é corporativo
//   2. Sugerir cadastro de email alternativo (pessoal)
//   3. Enviar emails críticos (boas-vindas, dossiê pronto, pagamento)
//      pro email principal + alternativo simultaneamente
//
// Por que essa lista existe: emails corporativos de banco/cooperativa/
// governo brasileiro têm filtros institucionais agressivos (allowlist
// de remetente, scoring estrito, bloqueio de DKIM externa). Mesmo com
// DMARC quarantine + SPF + DKIM perfeitos, taxa de entrega cai pra
// 30-60% em domínios como sicredi.com.br ou caixa.gov.br.
//
// A lista cobre os emissores mais frequentes do público AgroBridge
// (produtores rurais com email corporativo via cooperativa de crédito,
// banco rural, ou função pública). Não é exaustiva — se um domínio novo
// aparecer com frequência, adicionar aqui.

const DOMINIOS_BANCOS_COOPERATIVAS = new Set([
  // Cooperativas de crédito (mais comum no público rural)
  'sicredi.com.br',
  'sicoob.com.br',
  'cresol.com.br',
  'unicred.com.br',
  'ailos.com.br',
  // Bancos públicos
  'bb.com.br',
  'banco-do-brasil.com.br',
  'caixa.gov.br',
  'bnb.gov.br',
  'basa.com.br',
  'bndes.gov.br',
  // Bancos privados
  'itau-unibanco.com.br',
  'itau.com.br',
  'bradesco.com.br',
  'santander.com.br',
  'btgpactual.com',
  'safra.com.br',
  'original.com.br',
  'bv.com.br',
  // Fintechs (filtros menos restritos mas notáveis)
  'xpi.com.br',
  'xp.com.br',
  'nubank.com.br',
  'inter.co',
  'c6bank.com.br',
])

const DOMINIOS_GOV_BRASILEIROS = new Set([
  'gov.br',
  'mg.gov.br',
  'sp.gov.br',
  'rs.gov.br',
  'mt.gov.br',
  'ms.gov.br',
  'go.gov.br',
  'pr.gov.br',
  'sc.gov.br',
  'ba.gov.br',
  'pe.gov.br',
  'ce.gov.br',
  'mpf.mp.br',
  'mpsp.mp.br',
  'tj.jus.br',
  'tre.jus.br',
  'tcu.gov.br',
  'incra.gov.br',
  'mapa.gov.br',
  'embrapa.br',
])

const DOMINIOS_AGRO_INTEGRADORAS = new Set([
  // Integradoras + cooperativas agrícolas com TI estruturada
  'coamo.com.br',
  'cocamar.com.br',
  'aurora.coop.br',
  'lar.ind.br',
  'castrolanda.coop.br',
  'frisia.coop.br',
  'agrarialaticinios.com.br',
  'jbs.com.br',
  'brfsa.com',
  'marfrig.com.br',
  'minerva.com.br',
  'cargill.com',
  'adm.com',
  'bunge.com',
  'cofco.com',
])

/**
 * Tipo de domínio do email — usado pra decidir UX e estratégia de envio.
 *
 * - 'pessoal_alta_entrega': gmail, outlook, hotmail, yahoo — entrega quase 100%
 * - 'corporativo_banco': bancos/cooperativas — entrega instável
 * - 'corporativo_gov': governo brasileiro — entrega muito instável
 * - 'corporativo_agro': integradoras agro — entrega instável
 * - 'outro': domínio próprio ou desconhecido — entrega depende do MX
 */
export type TipoDominio =
  | 'pessoal_alta_entrega'
  | 'corporativo_banco'
  | 'corporativo_gov'
  | 'corporativo_agro'
  | 'outro'

const DOMINIOS_PESSOAIS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.com.br',
  'icloud.com',
  'me.com',
  'mac.com',
  'protonmail.com',
  'proton.me',
  'uol.com.br',
  'bol.com.br',
  'terra.com.br',
  'ig.com.br',
  'r7.com',
])

function extrairDominio(email: string): string {
  const at = email.lastIndexOf('@')
  if (at === -1) return ''
  return email.slice(at + 1).trim().toLowerCase()
}

/**
 * Match com sufixo — pra capturar variações tipo 'sp.gov.br' como subdomínio
 * de 'gov.br' (ambos contam como gov).
 */
function temSufixo(dominio: string, conjunto: Set<string>): boolean {
  if (conjunto.has(dominio)) return true
  for (const sufixo of conjunto) {
    if (dominio.endsWith('.' + sufixo)) return true
  }
  return false
}

export function tipoDominio(email: string): TipoDominio {
  const dom = extrairDominio(email)
  if (!dom) return 'outro'
  if (DOMINIOS_PESSOAIS.has(dom)) return 'pessoal_alta_entrega'
  if (temSufixo(dom, DOMINIOS_GOV_BRASILEIROS)) return 'corporativo_gov'
  if (temSufixo(dom, DOMINIOS_BANCOS_COOPERATIVAS)) return 'corporativo_banco'
  if (temSufixo(dom, DOMINIOS_AGRO_INTEGRADORAS)) return 'corporativo_agro'
  return 'outro'
}

/**
 * Atalho: true se o email pode ter problemas de entrega por filtro
 * institucional. Use pra decidir se mostra o warning ou se ativa
 * envio duplo.
 */
export function isEmailCorporativo(email: string): boolean {
  const tipo = tipoDominio(email)
  return (
    tipo === 'corporativo_banco' ||
    tipo === 'corporativo_gov' ||
    tipo === 'corporativo_agro'
  )
}

/**
 * Mensagem amigável pra mostrar no warning, contextualizando por tipo.
 * Não usa nome de banco específico (CLAUDE.md guard rail) — diz "banco/
 * cooperativa" genérico.
 */
export function mensagemDominioCorporativo(email: string): string | null {
  const tipo = tipoDominio(email)
  const dom = extrairDominio(email)
  if (tipo === 'corporativo_banco') {
    return `O TI do seu banco/cooperativa (@${dom}) costuma bloquear emails externos no firewall. Pra garantir que você receba o seu dossiê, pagamento e atualizações importantes, cadastre um email pessoal alternativo abaixo.`
  }
  if (tipo === 'corporativo_gov') {
    return `O TI da instituição pública (@${dom}) tem filtros muito restritos pra remetentes externos. Pra garantir entrega, cadastre um email pessoal alternativo abaixo.`
  }
  if (tipo === 'corporativo_agro') {
    return `O TI da integradora/cooperativa agro (@${dom}) pode bloquear emails externos. Cadastre um email pessoal alternativo pra receber comunicações importantes.`
  }
  return null
}
