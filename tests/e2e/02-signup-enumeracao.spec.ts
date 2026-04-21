import { test, expect } from './fixtures'
import { TEST_EMAIL } from './fixtures'

// Cenário 2 — Anti-enumeração no cadastro.
// Tentativa de cadastrar com email já existente DEVE retornar o mesmo
// fluxo de sucesso visível do que um email novo (sem vazar que a conta
// já existe). Protege contra enumeração de leads/clientes.
test('cadastro existente não vaza enumeração', async ({ page }) => {
  await page.goto('/cadastro')

  const emailField = page.getByLabel(/e-?mail/i)
  await emailField.fill(TEST_EMAIL)

  const nomeField = page.getByLabel(/nome/i).first()
  if (await nomeField.isVisible().catch(() => false)) {
    await nomeField.fill('Produtor Duplicado')
  }
  const whatsField = page.getByLabel(/whats|celular|telefone/i).first()
  if (await whatsField.isVisible().catch(() => false)) {
    await whatsField.fill('(67) 99999-0000')
  }
  const senhaField = page.getByLabel(/senha/i).first()
  if (await senhaField.isVisible().catch(() => false)) {
    await senhaField.fill('Senh@Duplicada-2026')
  }

  // Submeter.
  await page.getByRole('button', { name: /cadastr|criar conta|enviar/i }).click()

  // Deve ficar em /cadastro OU redirecionar pra tela genérica de
  // "verifique seu email" — nunca mostrar erro "email já cadastrado".
  await page.waitForTimeout(1500)

  const texto = (await page.content()).toLowerCase()
  expect(texto).not.toMatch(/j[aá] (existe|cadastrad)/i)
  expect(texto).not.toMatch(/email j[aá] est[aá]/i)
  expect(texto).not.toContain('conta já existe')
})
