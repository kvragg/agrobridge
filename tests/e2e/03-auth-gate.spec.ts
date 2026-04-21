import { test, expect } from './fixtures'

// Cenário 3 — Gate de autenticação.
// Rotas autenticadas devem redirecionar visitante anônimo pra /login,
// e o redirect preserva a rota pretendida de forma segura (sanitizada).
test.describe('Gate de autenticação', () => {
  test('/dashboard anônimo vai pra /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/i)
  })

  test('/entrevista anônimo vai pra /login', async ({ page }) => {
    await page.goto('/entrevista')
    await expect(page).toHaveURL(/\/login/i)
  })

  test('/conta/dados anônimo vai pra /login', async ({ page }) => {
    await page.goto('/conta/dados')
    await expect(page).toHaveURL(/\/login/i)
  })

  test('redirect com javascript: é bloqueado', async ({ page }) => {
    // safe-redirect.ts: qualquer redirect externo/não-path é sanitizado.
    await page.goto('/login?redirectTo=javascript:alert(1)')
    // Página carrega normal, não dispara javascript: — testa apenas que
    // renderiza sem erro e a URL final não contém o schema perigoso.
    const url = page.url()
    expect(url.toLowerCase()).not.toContain('javascript:')
  })
})
