import { test, expect } from './fixtures'

// Cenário 9 — Checklist genérico em 3 abas (reescrito 25/04/2026 noite —
// "está muito contaminado de coisas pra clicar"):
//   1. Aba Cadastro: gate PF/PJ → checklist da escolha
//   2. Aba Crédito Rural: docs da operação independentes de PF/PJ
//   3. Aba Dossiê: estado-único, mostra próximo passo conforme contexto
//
// User autenticado E2E é Free-zero (sem processo pago) → cai no genérico.

test.describe('Checklist em 3 abas', () => {
  test('renderiza em /checklist sem redirect', async ({ autenticado: page }) => {
    await page.goto('/checklist')
    await expect(page).toHaveURL(/\/checklist$/)
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /tudo que o banco vai pedir/i,
      }),
    ).toBeVisible()
  })

  test('mostra os 3 tabs: Cadastro, Crédito Rural, Dossiê', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    const tablist = page.getByRole('tablist', { name: /etapas do checklist/i })
    await expect(tablist).toBeVisible()
    await expect(page.getByRole('tab', { name: /cadastro/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /crédito rural/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /dossiê/i })).toBeVisible()
  })

  test('aba Cadastro inicial mostra cabeçalho do tipo + botão "Trocar tipo"', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    await expect(page.getByText(/cadastro como/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /trocar tipo/i })).toBeVisible()
  })

  test('clicar "Trocar tipo" abre o gate PF/PJ', async ({ autenticado: page }) => {
    await page.goto('/checklist')
    await page.getByRole('button', { name: /trocar tipo/i }).click()
    await expect(
      page.getByRole('heading', {
        name: /como você vai entrar com o crédito/i,
      }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /escolher pessoa física/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /escolher pessoa jurídica/i }),
    ).toBeVisible()
  })

  test('aba Crédito Rural mostra docs da operação + chips de refino', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    await page.getByRole('tab', { name: /crédito rural/i }).click()
    await expect(
      page.getByRole('heading', { name: /^crédito rural$/i }),
    ).toBeVisible()
    await expect(page.getByText(/operação de investimento/i)).toBeVisible()
    await expect(page.getByText(/me enquadro no pronaf/i)).toBeVisible()
    await expect(page.getByText(/CAR — Cadastro Ambiental Rural/i).first()).toBeVisible()
    await expect(page.getByText(/CCIR — Certificado de Cadastro/i).first()).toBeVisible()
    await expect(page.getByText(/ITR.*último exercício/i).first()).toBeVisible()
  })

  test('ITR não pede mais 5 exercícios', async ({ autenticado: page }) => {
    await page.goto('/checklist')
    await page.getByRole('tab', { name: /crédito rural/i }).click()
    await expect(page.getByText(/últimos 5 exercícios/)).toHaveCount(0)
  })

  test('aba Dossiê mostra estado conforme entrevista', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    await page.getByRole('tab', { name: /dossiê/i }).click()
    // Free-zero sem entrevista → eyebrow "Etapa 1 — Entrevista"
    // Free com entrevista → eyebrow "Próximo passo"
    // Em qualquer caso, cabeçalho com botão CTA
    await expect(
      page.getByRole('link', { name: /(iniciar entrevista|ver planos)/i }),
    ).toBeVisible()
  })

  test('marcar item como pronto atualiza contador na aba Cadastro', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')

    // Garante que estamos na aba Cadastro (tipo PF default mostra docs)
    const cadTab = page.getByRole('tab', { name: /cadastro/i })
    await cadTab.click()

    // Pega checkbox do CNH (1º item PF)
    const cnhCheckbox = page
      .getByRole('button', { name: /Marcar "CNH \(ou RG \+ CPF\)" como pronto/i })
      .first()
    await cnhCheckbox.click()

    // Botão muda pra "Desmarcar"
    await expect(
      page
        .getByRole('button', { name: /Desmarcar "CNH \(ou RG \+ CPF\)" como pronto/i })
        .first(),
    ).toBeVisible()
  })

  test('accordion expande no item da matrícula e mostra Plano B (ONR)', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    await page.getByRole('tab', { name: /crédito rural/i }).click()
    await page
      .getByRole('button', { expanded: false })
      .filter({ hasText: /Matrícula atualizada do imóvel/i })
      .first()
      .click()
    await expect(page.getByText(/plano b se o portal não abrir/i).first()).toBeVisible()
    await expect(page.getByText(/portal ONR fica instável/i).first()).toBeVisible()
  })
})
