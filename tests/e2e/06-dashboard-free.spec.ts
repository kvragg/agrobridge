import { test, expect } from './fixtures'

// Cenário 6 — Dashboard estado Free-zero.
// Usuário logado SEM processo e SEM tier deve ver a copy nova da Onda 2
// (A.3): dor + autoridade + urgência Plano Safra, benefícios com checks
// e CTA "Falar com a IA AgroBridge agora". Valida que o encoding UTF-8
// não quebrou acentuação (A.2) e que não citamos marcas de banco.
test.describe('Dashboard Free-zero', () => {
  test('mostra copy nova com CTA pra IA e urgência Plano Safra', async ({
    autenticado: page,
  }) => {
    await page.goto('/dashboard')

    const conteudo = (await page.content()).toLowerCase()

    // A.3 — presença da copy chave.
    expect(conteudo).toMatch(/plano safra/i)
    expect(conteudo).toMatch(/(mcr|manual de cr[eé]dito rural)/i)

    // CTA principal pra entrevista.
    const ctas = await page
      .getByRole('link')
      .filter({ hasText: /ia agrobridge|falar com|come[çc]ar/i })
      .all()
    expect(ctas.length).toBeGreaterThan(0)
    await expect(ctas[0]).toBeVisible()

    // A.2 — encoding: nenhum caractere de replacement (U+FFFD).
    expect(conteudo).not.toContain('�')

    // Regra: nunca citar marcas específicas de banco.
    for (const marca of [
      'sicredi',
      'sicoob',
      'banco do brasil',
      'caixa econômica',
      'bradesco',
      'santander',
    ]) {
      expect(conteudo).not.toContain(marca)
    }
  })

  test('dashboard Free NÃO exibe preços (preços moram só em /planos)', async ({
    autenticado: page,
  }) => {
    await page.goto('/dashboard')
    const conteudo = await page.content()
    // B.2 — valores nominais saíram do dashboard. Só aparecem em /planos.
    expect(conteudo).not.toMatch(/R\$\s*29,99/)
    expect(conteudo).not.toMatch(/R\$\s*297,99/)
    expect(conteudo).not.toMatch(/R\$\s*697,99/)
  })
})
