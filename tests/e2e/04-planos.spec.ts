import { test, expect } from './fixtures'

// Cenário 4 — Página /planos (comercial).
// Único lugar onde preços aparecem pra usuário logado (regra B.2 da
// Onda 3). Valida: heading comercial, 3 cards pelos nomes de produto
// e preços batem com TIER_PRECO_CENTAVOS.
test.describe('Planos (comercial)', () => {
  test('usuário logado vê os 3 planos com preços', async ({
    autenticado: page,
  }) => {
    await page.goto('/planos')
    await expect(
      page.getByRole('heading', { level: 1, name: /escolha|plano/i })
    ).toBeVisible()

    // Nomes batem em múltiplos lugares (h3 do card, CTA, feature list).
    // Usamos role=heading pra escopar no título do card.
    await expect(
      page.getByRole('heading', { name: /^diagn[oó]stico r[aá]pido$/i })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /^doss[iî][eê] banc[aá]rio completo$/i })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /mesa de cr[eé]dito/i })
    ).toBeVisible()

    const html = (await page.content()).toLowerCase()
    expect(html).toMatch(/29,99/)
    expect(html).toMatch(/297,99/)
    expect(html).toMatch(/697,99/)
  })
})
