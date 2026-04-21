import { test as base, expect, type Page } from '@playwright/test'

export const TEST_EMAIL =
  process.env.E2E_TEST_EMAIL ?? 'e2e-teste@agrobridge.app'
export const TEST_PASSWORD =
  process.env.E2E_TEST_PASSWORD ?? 'Senh@E2E-Teste-2026'

export async function fazerLogin(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/e-?mail/i).fill(TEST_EMAIL)
  await page.getByLabel(/senha/i).first().fill(TEST_PASSWORD)
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login'), {
      timeout: 15_000,
    }),
    page.getByRole('button', { name: /entrar/i }).click(),
  ])
}

export const test = base.extend<{ autenticado: Page }>({
  autenticado: async ({ page }, use) => {
    await fazerLogin(page)
    await use(page)
  },
})

export { expect }
