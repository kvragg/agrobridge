import { describe, it, expect } from 'vitest'
import {
  CHECKLIST_PADRAO,
  filtrarChecklistPorContexto,
  itensDoSocio,
  ITENS_POR_SOCIO,
  resumoChecklistPadrao,
} from '@/data/checklist-padrao'

// ============================================================
// [PJ-25/04] Filtragem do checklist padrão por contexto
// ============================================================
// `filtrarChecklistPorContexto` decide quais itens fixos aparecem
// pra um lead conforme: leadType (PF/PJ), casado, investimento,
// pronaf. `itensDoSocio` renderiza N itens por sócio respeitando
// o estado civil.
//
// Cobertura: 16 combinações (2 leadType × 2 casado × 2 invest × 2 pronaf).
// Snapshot dos slugs esperados pra cada cenário central.
// ============================================================

const ALL_SLUGS = CHECKLIST_PADRAO.map((i) => i.id)

function slugsFiltrados(ctx: Parameters<typeof filtrarChecklistPorContexto>[1]) {
  return filtrarChecklistPorContexto(CHECKLIST_PADRAO, ctx).map((i) => i.id)
}

describe('filtrarChecklistPorContexto — PF', () => {
  it('PF mínimo (solteiro, custeio, não-Pronaf): só docs base', () => {
    const slugs = slugsFiltrados({
      leadType: 'pf',
      casado: false,
      investimento: false,
      pronaf: false,
    })
    expect(slugs).toContain('cnh')
    expect(slugs).toContain('comprovante_endereco')
    expect(slugs).toContain('ir_pf')
    expect(slugs).toContain('car')
    expect(slugs).toContain('ccir')
    expect(slugs).toContain('itr')
    expect(slugs).toContain('matricula')
    expect(slugs).toContain('cnds')
    expect(slugs).toContain('comprovante_producao')
    // Esconde
    expect(slugs).not.toContain('certidao_casamento')
    expect(slugs).not.toContain('cnh_conjuge')
    expect(slugs).not.toContain('estudo_limites')
    expect(slugs).not.toContain('projeto')
    expect(slugs).not.toContain('croqui')
    expect(slugs).not.toContain('dap_caf')
    // Nunca PJ
    expect(slugs).not.toContain('contrato_social')
    expect(slugs).not.toContain('balanco_patrimonial')
    expect(slugs).not.toContain('comprovante_endereco_empresa')
  })

  it('PF casado: certidão + CNH cônjuge entram', () => {
    const slugs = slugsFiltrados({
      leadType: 'pf',
      casado: true,
      investimento: false,
      pronaf: false,
    })
    expect(slugs).toContain('certidao_casamento')
    expect(slugs).toContain('cnh_conjuge')
  })

  it('PF investimento: estudo_limites + projeto + croqui entram', () => {
    const slugs = slugsFiltrados({
      leadType: 'pf',
      casado: false,
      investimento: true,
      pronaf: false,
    })
    expect(slugs).toContain('estudo_limites')
    expect(slugs).toContain('projeto')
    expect(slugs).toContain('croqui')
  })

  it('PF Pronaf: dap_caf entra', () => {
    const slugs = slugsFiltrados({
      leadType: 'pf',
      casado: false,
      investimento: false,
      pronaf: true,
    })
    expect(slugs).toContain('dap_caf')
  })

  it('PF tudo ativo: todos os condicionais aparecem', () => {
    const slugs = slugsFiltrados({
      leadType: 'pf',
      casado: true,
      investimento: true,
      pronaf: true,
    })
    expect(slugs).toContain('certidao_casamento')
    expect(slugs).toContain('cnh_conjuge')
    expect(slugs).toContain('estudo_limites')
    expect(slugs).toContain('projeto')
    expect(slugs).toContain('croqui')
    expect(slugs).toContain('dap_caf')
  })
})

describe('filtrarChecklistPorContexto — PJ', () => {
  it('PJ não mostra itens de cadastro PF (cnh, ir_pf, etc)', () => {
    const slugs = slugsFiltrados({
      leadType: 'pj',
      casado: false,
      investimento: false,
      pronaf: false,
    })
    expect(slugs).not.toContain('cnh')
    expect(slugs).not.toContain('ir_pf')
    expect(slugs).not.toContain('comprovante_endereco')
    expect(slugs).not.toContain('certidao_casamento')
    expect(slugs).not.toContain('cnh_conjuge')
    expect(slugs).not.toContain('estudo_limites')
  })

  it('PJ inclui bloco empresa', () => {
    const slugs = slugsFiltrados({
      leadType: 'pj',
      casado: false,
      investimento: false,
      pronaf: false,
    })
    expect(slugs).toContain('contrato_social')
    expect(slugs).toContain('balanco_patrimonial')
    expect(slugs).toContain('dre')
    expect(slugs).toContain('faturamento_12m')
    expect(slugs).toContain('comprovante_endereco_empresa')
  })

  it('PJ não inclui itens "socios" — eles vêm via itensDoSocio', () => {
    const slugs = slugsFiltrados({
      leadType: 'pj',
      casado: false,
      investimento: false,
      pronaf: false,
    })
    for (const tpl of ITENS_POR_SOCIO) {
      expect(slugs).not.toContain(tpl.id)
    }
  })

  it('PJ inclui crédito rural igual PF', () => {
    const slugs = slugsFiltrados({
      leadType: 'pj',
      casado: false,
      investimento: false,
      pronaf: false,
    })
    expect(slugs).toContain('car')
    expect(slugs).toContain('ccir')
    expect(slugs).toContain('itr')
    expect(slugs).toContain('matricula')
    expect(slugs).toContain('cnds')
    expect(slugs).toContain('comprovante_producao')
  })

  it('PJ investimento: projeto + croqui entram', () => {
    const slugs = slugsFiltrados({
      leadType: 'pj',
      casado: false,
      investimento: true,
      pronaf: false,
    })
    expect(slugs).toContain('projeto')
    expect(slugs).toContain('croqui')
  })

  it('PJ Pronaf: dap_caf entra', () => {
    const slugs = slugsFiltrados({
      leadType: 'pj',
      casado: false,
      investimento: false,
      pronaf: true,
    })
    expect(slugs).toContain('dap_caf')
  })

  it('PJ ignora flag casado (não aplicável ao titular — é por sócio)', () => {
    const a = slugsFiltrados({
      leadType: 'pj',
      casado: true,
      investimento: false,
      pronaf: false,
    })
    const b = slugsFiltrados({
      leadType: 'pj',
      casado: false,
      investimento: false,
      pronaf: false,
    })
    expect(a).toEqual(b)
  })
})

describe('itensDoSocio', () => {
  it('sócio solteiro: 3 itens (sem cônjuge)', () => {
    const items = itensDoSocio({
      id: 'abc',
      estado_civil: 'solteiro',
      full_name: 'João',
    })
    const slugs = items.map((i) => i.id)
    expect(slugs).toContain('socio_abc_socio_cnh')
    expect(slugs).toContain('socio_abc_socio_comprovante_endereco')
    expect(slugs).toContain('socio_abc_socio_ir')
    expect(slugs).not.toContain('socio_abc_socio_certidao_casamento')
    expect(slugs).not.toContain('socio_abc_socio_cnh_conjuge')
    expect(items.length).toBe(3)
  })

  it('sócio casado: 5 itens (inclui cônjuge)', () => {
    const items = itensDoSocio({
      id: 'xyz',
      estado_civil: 'casado',
      full_name: 'Maria',
    })
    const slugs = items.map((i) => i.id)
    expect(slugs).toContain('socio_xyz_socio_certidao_casamento')
    expect(slugs).toContain('socio_xyz_socio_cnh_conjuge')
    expect(items.length).toBe(5)
  })

  it('sócio em união estável: tratado como casado', () => {
    const items = itensDoSocio({
      id: 'q',
      estado_civil: 'uniao_estavel',
      full_name: 'Carlos',
    })
    expect(items.length).toBe(5)
  })

  it('sócio divorciado/viuvo: tratado como solteiro', () => {
    const div = itensDoSocio({
      id: 'd',
      estado_civil: 'divorciado',
      full_name: 'Ana',
    })
    const viu = itensDoSocio({
      id: 'v',
      estado_civil: 'viuvo',
      full_name: 'Luis',
    })
    expect(div.length).toBe(3)
    expect(viu.length).toBe(3)
  })

  it('IDs prefixados garantem unicidade entre sócios', () => {
    const a = itensDoSocio({ id: 'a', estado_civil: 'solteiro', full_name: '' })
    const b = itensDoSocio({ id: 'b', estado_civil: 'solteiro', full_name: '' })
    const interseccao = a
      .map((i) => i.id)
      .filter((id) => b.map((j) => j.id).includes(id))
    expect(interseccao).toEqual([])
  })

  it('cada item carrega socio_id', () => {
    const items = itensDoSocio({
      id: 'meu-id',
      estado_civil: 'solteiro',
      full_name: '',
    })
    for (const it of items) {
      expect(it.socio_id).toBe('meu-id')
    }
  })
})

describe('resumoChecklistPadrao', () => {
  it('contagem bate com filtro PF mínimo', () => {
    const items = filtrarChecklistPorContexto(CHECKLIST_PADRAO, {
      leadType: 'pf',
      casado: false,
      investimento: false,
      pronaf: false,
    })
    const r = resumoChecklistPadrao(items)
    expect(r.total).toBe(items.length)
    expect(r.obrigatorios).toBe(items.filter((i) => i.obrigatorio).length)
    expect(r.opcionais).toBe(items.filter((i) => !i.obrigatorio).length)
  })
})

describe('Sanity check do CHECKLIST_PADRAO', () => {
  it('todos os items têm grupo válido', () => {
    const valid = ['cadastro', 'empresa', 'socios', 'credito_rural']
    for (const it of CHECKLIST_PADRAO) {
      expect(valid).toContain(it.grupo)
    }
  })

  it('todos os IDs são únicos', () => {
    const set = new Set(ALL_SLUGS)
    expect(set.size).toBe(ALL_SLUGS.length)
  })

  it('itens "todos" pertencem ao crédito rural (única forma de aparecer pra ambos)', () => {
    for (const it of CHECKLIST_PADRAO) {
      if (it.aplica_se?.todos) {
        expect(it.grupo).toBe('credito_rural')
      }
    }
  })

  it('itens PF só pertencem ao grupo cadastro', () => {
    for (const it of CHECKLIST_PADRAO) {
      if (it.aplica_se?.pf && !it.aplica_se?.todos) {
        expect(it.grupo).toBe('cadastro')
      }
    }
  })

  it('itens PJ exclusivos pertencem ao grupo empresa', () => {
    for (const it of CHECKLIST_PADRAO) {
      if (it.aplica_se?.pj && !it.aplica_se?.todos && !it.aplica_se?.pf) {
        expect(it.grupo).toBe('empresa')
      }
    }
  })

  it('ITR não pede histórico (só último exercício)', () => {
    const itr = CHECKLIST_PADRAO.find((i) => i.id === 'itr')
    expect(itr?.nome).toMatch(/último exercício/i)
    expect(itr?.nome).not.toMatch(/5 exercícios/)
    expect(itr?.descricao).not.toMatch(/últimos 5/i)
    // Os passos podem mencionar histórico só pra DESACONSELHAR ("não é
    // necessário trazer"). Não devem instruir a baixar múltiplos.
    const passos = itr?.passos.join(' ') ?? ''
    expect(passos).not.toMatch(/baixe.*5\s*exercícios/i)
    expect(passos).not.toMatch(/baixe.*últimos\s*5/i)
  })
})
