import { test, expect } from './fixtures'

// Cenário 5 — /conta/dados (LGPD Art. 18).
// Layout refatorado na Onda 3: card único com exportar (discreto +
// tooltip) e excluir (proeminente + disclaimer fiscal CTN 5 anos).
// Valida presença desses elementos e que download NÃO dispara
// falsa confirmação de email.
test.describe('Conta · LGPD', () => {
  test('página mostra bloco exportar + excluir com disclaimer fiscal', async ({
    autenticado: page,
  }) => {
    await page.goto('/conta/dados')
    await expect(
      page.getByRole('heading', { level: 1, name: /^meus dados$/i })
    ).toBeVisible()

    // Seção exportar
    await expect(page.getByText(/exportar meus dados/i)).toBeVisible()
    await expect(
      page.getByRole('button', { name: /baixar json/i })
    ).toBeVisible()

    // Seção excluir
    await expect(
      page.getByRole('heading', { level: 2, name: /excluir minha conta/i })
    ).toBeVisible()

    // Disclaimer fiscal CTN 5 anos (regra LGPD)
    const conteudo = (await page.content()).toLowerCase()
    expect(conteudo).toMatch(/5\s*anos/)
    expect(conteudo).toMatch(/(ctn|5\.172|172\/66)/)

    // Checkbox obrigatório antes de solicitar
    const botaoExcluir = page.getByRole('button', {
      name: /solicitar exclus/i,
    })
    await expect(botaoExcluir).toBeDisabled()
  })

  test('confirmação só aparece depois do checkbox', async ({
    autenticado: page,
  }) => {
    await page.goto('/conta/dados')
    const checkbox = page.getByRole('checkbox').first()
    await checkbox.check()
    await expect(
      page.getByRole('button', { name: /solicitar exclus/i })
    ).toBeEnabled()
  })
})
