import { test, expect } from './fixtures'
import { TEST_EMAIL } from './fixtures'

// Cenário 2 — Anti-enumeração no cadastro.
// Tentativa de cadastrar com email já existente DEVE seguir o mesmo
// fluxo visível do que um email novo (sem vazar que a conta já existe).
test('cadastro existente não vaza enumeração', async ({ page }) => {
  await page.goto('/cadastro')

  // Campos por type — labels não usam htmlFor no app.
  await page.locator('input[type="text"]').first().fill('Produtor Duplicado')
  await page.locator('input[type="tel"]').first().fill('(67) 99999-0000')
  await page.locator('input[type="email"]').first().fill(TEST_EMAIL)

  const senhas = page.locator('input[type="password"]')
  await senhas.nth(0).fill('Senh@Duplicada-2026')
  await senhas.nth(1).fill('Senh@Duplicada-2026')

  // Termos: checkbox controlado — click direto garante re-render React.
  await page.locator('#termos').check()

  // Botão tem texto "Criar minha conta".
  const botao = page.getByRole('button', { name: /criar minha conta/i })
  await expect(botao).toBeEnabled()
  await botao.click()

  // Espera resposta da API (200 indistinguível por desenho).
  await page.waitForTimeout(3000)

  const texto = (await page.content()).toLowerCase()
  expect(texto).not.toMatch(/j[aá]\s+(existe|cadastrad)/)
  expect(texto).not.toMatch(/email\s+j[aá]\s+est[aá]/)
  expect(texto).not.toContain('conta já existe')
  expect(texto).not.toContain('usuario ja cadastrado')
})
