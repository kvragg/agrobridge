import { test, expect } from './fixtures'
import { TEST_EMAIL, TEST_PASSWORD } from './fixtures'

// Cenário 3 — Gate de autenticação + safe-redirect.
// Rotas autenticadas redirecionam visitante anônimo pra /login.
// Após login, o param `?next=` deve ser sanitizado — valores externos
// ou com schema perigoso caem no fallback /dashboard.
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

  test('login com next=javascript: sanitiza redirect', async ({ page }) => {
    // safe-redirect.ts: schemas perigosos caem no fallback `/dashboard`.
    await page.goto('/login?next=javascript:alert(1)')
    await page.locator('input[type="email"]').first().fill(TEST_EMAIL)
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /^entrar$|entrando/i }).click()

    await page.waitForURL(
      (url) => !url.pathname.startsWith('/login'),
      { timeout: 20_000 }
    )

    // Redirect pós-login nunca pode cair num schema javascript:.
    expect(page.url().toLowerCase()).not.toContain('javascript:')
    // Fallback é /dashboard.
    await expect(page).toHaveURL(/\/dashboard/i)
  })
})
