import { test, expect } from './fixtures'

// Cenário 11 — Email alternativo (LGPD + recebimento duplicado).
// Bloco em /conta/dados pra cadastrar email pessoal alternativo. Útil
// quando email principal é corporativo (Sicredi/BB/gov etc) — sistema
// envia cópias de emails críticos pra ambos.
//
// User E2E principal é @agrobridge.space (não corporativo) → vê texto
// neutro "(opcional)". Mesmo assim deve renderizar o card e aceitar
// salvar/remover.

test.describe('Email alternativo', () => {
  test('bloco renderiza em /conta/dados', async ({ autenticado: page }) => {
    await page.goto('/conta/dados')

    await expect(
      page.getByRole('heading', { name: /email alternativo/i }),
    ).toBeVisible()
  })

  test('input de email + botão Salvar visíveis', async ({
    autenticado: page,
  }) => {
    await page.goto('/conta/dados')

    const input = page
      .locator('input[type="email"][placeholder*="email-pessoal"]')
      .first()
    await expect(input).toBeVisible()
    await expect(input).toBeEditable()

    // Botão Salvar inicia desabilitado (input vazio)
    const salvar = page.getByRole('button', { name: /^salvar$/i })
    await expect(salvar).toBeVisible()
  })

  test('validação rejeita email igual ao principal', async ({
    autenticado: page,
  }) => {
    await page.goto('/conta/dados')

    // Tenta cadastrar o mesmo email do user (TEST_EMAIL é
    // 'e2e-teste@agrobridge.space' por padrão)
    const input = page
      .locator('input[type="email"][placeholder*="email-pessoal"]')
      .first()
    await input.fill('e2e-teste@agrobridge.space')

    await page.getByRole('button', { name: /^salvar$/i }).click()

    // Mensagem de erro aparece (vermelho)
    await expect(
      page.getByText(/diferente do email principal/i),
    ).toBeVisible({ timeout: 5_000 })
  })

  test('salva email alternativo válido e mostra estado ativo', async ({
    autenticado: page,
  }) => {
    await page.goto('/conta/dados')

    const altEmail = `e2e-alt-${Date.now()}@gmail.com`
    const input = page
      .locator('input[type="email"][placeholder*="email-pessoal"]')
      .first()
    await input.fill(altEmail)

    await page.getByRole('button', { name: /^salvar$/i }).click()

    // Estado pós-salvar: email aparece em destaque + opção de remover
    await expect(page.getByText(altEmail)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /^remover$/i })).toBeVisible()

    // Cleanup: remove pra deixar conta limpa pro próximo run
    await page.getByRole('button', { name: /^remover$/i }).click()
    await expect(
      page
        .locator('input[type="email"][placeholder*="email-pessoal"]')
        .first(),
    ).toBeVisible({ timeout: 5_000 })
  })
})
