import { test as base, expect, type Page } from '@playwright/test'

export const TEST_EMAIL =
  process.env.E2E_TEST_EMAIL ?? 'e2e-teste@agrobridge.space'
export const TEST_PASSWORD =
  process.env.E2E_TEST_PASSWORD ?? 'Senh@E2E-Teste-2026'

// Os <label> do app não usam htmlFor pra associar inputs, então
// getByLabel falha. Usar type selectors é estável e independente de copy.
export async function fazerLogin(page: Page) {
  await page.goto('/login')
  await page.locator('input[type="email"]').first().fill(TEST_EMAIL)
  await page.locator('input[type="password"]').first().fill(TEST_PASSWORD)
  await Promise.all([
    page.waitForURL(
      (url) =>
        !url.pathname.startsWith('/login') &&
        !url.pathname.startsWith('/cadastro'),
      { timeout: 20_000 }
    ),
    page.getByRole('button', { name: /^entrar$|entrando/i }).click(),
  ])
}

// Specs autenticados rodam no project "autenticado", que já carrega
// storageState do auth.setup.ts. O fixture vira alias de `page` — não
// re-loga (evitamos 429 no /api/auth/login).
export const test = base.extend<{ autenticado: Page }>({
  autenticado: async ({ page }, use) => {
    await use(page)
  },
})

export { expect }
