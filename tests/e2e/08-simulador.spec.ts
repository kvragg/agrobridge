import { test, expect } from './fixtures'

// Cenário 8 — Simulador de viabilidade.
// User autenticado (que no E2E é Free-zero) DEVE ver paywall.
// Não testamos versão Bronze+ aqui (precisa de mock de plano);
// validação real do motor está em __tests__/simulator/engine.test.ts.

test.describe('Simulador', () => {
  test('user free vê paywall em /simulador', async ({ autenticado: page }) => {
    await page.goto('/simulador')
    await expect(
      page.getByRole('heading', { level: 2, name: /a partir do plano bronze/i })
    ).toBeVisible()
    // CTA pra planos
    await expect(page.getByRole('link', { name: /ver planos/i }).first()).toBeVisible()
  })

  test('user free vê paywall em /simulador/comparar', async ({ autenticado: page }) => {
    await page.goto('/simulador/comparar')
    await expect(page.getByText(/disponível no bronze/i)).toBeVisible()
  })

  test('user free vê paywall em /simulador/historico', async ({ autenticado: page }) => {
    await page.goto('/simulador/historico')
    await expect(page.getByText(/histórico disponível no bronze/i)).toBeVisible()
  })
})
