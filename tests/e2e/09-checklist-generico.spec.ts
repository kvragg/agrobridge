import { test, expect } from './fixtures'

// Cenário 9 — Checklist genérico (acessível a TODOS os users desde 25/04).
// Antes redirecionava pra /dashboard se sem processo pago. Agora renderiza
// 9 docs core do crédito rural (SICAR, e-CAC, ONR, etc) com accordion
// expansível por item — cada um com passo-a-passo + Plano B se portal cair.
//
// User autenticado E2E é Free-zero (sem processo pago) → cai no genérico.

test.describe('Checklist genérico', () => {
  test('Free user vê checklist genérico em /checklist (sem redirect pra /dashboard)', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')

    // Permanece em /checklist (não foi redirecionado pra dashboard)
    await expect(page).toHaveURL(/\/checklist$/)

    // Header esperado
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /documentos que o banco precisa ver/i,
      }),
    ).toBeVisible()
  })

  test('exibe os 9 documentos core (8 obrigatórios + 1 opcional)', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')

    // 8 obrigatórios — verificar uns key
    await expect(page.getByText('CPF (PF) ou CNPJ + Contrato Social (PJ)')).toBeVisible()
    await expect(page.getByText(/^Comprovante de residência$/)).toBeVisible()
    await expect(page.getByText('CAR — Cadastro Ambiental Rural')).toBeVisible()
    await expect(
      page.getByText('CCIR — Certificado de Cadastro de Imóvel Rural'),
    ).toBeVisible()
    await expect(page.getByText('ITR — últimos 5 exercícios')).toBeVisible()
    await expect(page.getByText('Matrícula atualizada do imóvel')).toBeVisible()
    await expect(
      page.getByText(
        'Certidões negativas — Receita Federal, INSS, Trabalhista',
      ),
    ).toBeVisible()
    await expect(
      page.getByText('Comprovante de produção / faturamento'),
    ).toBeVisible()

    // 1 opcional (DAP/CAF)
    await expect(page.getByText('DAP / CAF (se Pronaf)')).toBeVisible()
  })

  test('accordion expande ao clicar e mostra passos + link do portal', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')

    // Clica no botão do CAR
    const carBtn = page
      .getByRole('button', { name: /CAR — Cadastro Ambiental Rural/i })
      .first()
    await carBtn.click()

    // Após expandir, deve aparecer o link pro SICAR + ao menos 1 passo
    await expect(page.getByRole('link', { name: /SICAR/i })).toBeVisible()
    await expect(
      page.getByText(/acesse car\.gov\.br e localize o imóvel/i),
    ).toBeVisible()
  })

  test('item com nota_instabilidade exibe Plano B (CAF e ONR)', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')

    // Expande matrícula (ONR — instável)
    await page
      .getByRole('button', { name: /Matrícula atualizada do imóvel/i })
      .first()
      .click()

    // Plano B deve aparecer
    await expect(page.getByText(/plano b se o portal não abrir/i).first()).toBeVisible()
    await expect(page.getByText(/portal ONR fica instável/i)).toBeVisible()

    // Expande DAP/CAF
    await page
      .getByRole('button', { name: /DAP \/ CAF \(se Pronaf\)/i })
      .first()
      .click()

    await expect(page.getByText(/portal CAF Online.*fora do ar/i)).toBeVisible()
  })

  test('banner de incentivo à entrevista aparece pra quem não fez', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')

    // Banner em ouro com CTA pra /entrevista/nova
    await expect(page.getByText(/checklist personalizado/i).first()).toBeVisible()
    await expect(
      page.getByRole('link', { name: /iniciar entrevista/i }),
    ).toBeVisible()
  })
})
