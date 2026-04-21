import { test as setup, expect } from '@playwright/test'
import { fazerLogin } from './fixtures'

// Auth setup — roda ANTES de todos os specs que dependem de sessão.
// Loga uma única vez com o user do seed e serializa o estado (cookies,
// localStorage) pra `tests/e2e/.auth/user.json`. Cada spec carrega esse
// arquivo como `storageState` e entra autenticado sem re-chamar o login
// (evita 429 do rate-limit 5/15min do /api/auth/login).

const authFile = 'tests/e2e/.auth/user.json'

setup('autenticar user de E2E', async ({ page }) => {
  await fazerLogin(page)
  // Sanity: estamos mesmo logados (fora das telas de auth).
  await expect(page).not.toHaveURL(/\/login|\/cadastro/)
  await page.context().storageState({ path: authFile })
})
