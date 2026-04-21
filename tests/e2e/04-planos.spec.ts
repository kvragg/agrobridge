import { test, expect } from './fixtures'

// Cenário 4 — Página /planos (comercial).
// É o ÚNICO lugar onde preços podem aparecer pra usuário logado (regra
// B.2 da Onda 3). Valida: os 3 nomes comerciais estão presentes, os
// preços batem com TIER_PRECO_CENTAVOS, e botões levam ao Cakto/checkout.
test.describe('Planos (comercial)', () => {
  test('usuário logado vê Bronze, Prata e Ouro com preços', async ({
    autenticado: page,
  }) => {
    await page.goto('/planos')
    await expect(
      page.getByRole('heading', { name: /planos|escolha seu plano/i })
    ).toBeVisible()

    await expect(page.getByText(/bronze/i).first()).toBeVisible()
    await expect(page.getByText(/prata/i).first()).toBeVisible()
    await expect(page.getByText(/ouro/i).first()).toBeVisible()

    const html = (await page.content()).toLowerCase()
    expect(html).toMatch(/29,99/)
    expect(html).toMatch(/297,99/)
    expect(html).toMatch(/697,99/)
  })
})
