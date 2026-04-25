import { test, expect } from './fixtures'

// Cenário 9 — Checklist genérico (acessível a TODOS sem processo pago).
// Reescrito 25/04/2026 (onda PJ + UX anti-abandono):
//   - Greeting personalizado pelo nome
//   - Switch PF/PJ no topo + sub-accordion de sócios
//   - Refinos inline (casado/investimento/pronaf) escondem docs irrelevantes
//   - Barra de progresso com microcopy contextual
//   - Quick wins primeiro com badge "rápido"
//   - Marcar item como pronto via checkbox grande à esquerda
//
// User autenticado E2E é Free-zero (sem processo pago) → cai no genérico.

test.describe('Checklist genérico (PF/PJ + UX anti-abandono)', () => {
  test('renderiza em /checklist sem redirecionar', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    await expect(page).toHaveURL(/\/checklist$/)
    // Header H1 (do server component)
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: /documentos do crédito/i,
      }),
    ).toBeVisible()
  })

  test('mostra barra de progresso com 0% ao abrir', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    const bar = page.getByRole('progressbar', { name: /progresso/i })
    await expect(bar).toBeVisible()
    await expect(bar).toHaveAttribute('aria-valuenow', '0')
  })

  test('mostra switch PF/PJ no header com opção de trocar', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    await expect(
      page.getByRole('button', { name: /trocar tipo de cadastro/i }),
    ).toBeVisible()
  })

  test('chips de refino aparecem (casado/investimento/Pronaf)', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    // PF — sou casado(a) aparece. Em PJ ele some.
    await expect(page.getByText(/sou casado\(a\) ou em união estável/i)).toBeVisible()
    await expect(page.getByText(/operação de investimento/i)).toBeVisible()
    await expect(page.getByText(/me enquadro no pronaf/i)).toBeVisible()
  })

  test('exibe os documentos core (CNH, CAR, ITR último exercício, matrícula)', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    await expect(page.getByText(/CNH \(ou RG \+ CPF\)/i).first()).toBeVisible()
    await expect(page.getByText(/CAR — Cadastro Ambiental Rural/i).first()).toBeVisible()
    await expect(page.getByText(/CCIR — Certificado de Cadastro/i).first()).toBeVisible()
    // ITR — só último exercício (correção do dia)
    await expect(
      page.getByText(/ITR.*último exercício/i).first(),
    ).toBeVisible()
    await expect(
      page.getByText(/Matrícula atualizada do imóvel/i).first(),
    ).toBeVisible()
  })

  test('ITR não pede mais 5 exercícios em lugar nenhum', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    // Garantia: o texto antigo não pode aparecer.
    await expect(page.getByText(/últimos 5 exercícios/)).toHaveCount(0)
  })

  test('accordion expande ao clicar e mostra link do portal', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    const carBtn = page
      .getByRole('button', { expanded: false })
      .filter({ hasText: /CAR — Cadastro Ambiental Rural/i })
      .first()
    await carBtn.click()
    await expect(page.getByRole('link', { name: /SICAR/i }).first()).toBeVisible()
  })

  test('Plano B aparece no item da matrícula (ONR instável)', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    await page
      .getByRole('button', { expanded: false })
      .filter({ hasText: /Matrícula atualizada do imóvel/i })
      .first()
      .click()
    await expect(page.getByText(/plano b se o portal não abrir/i).first()).toBeVisible()
    await expect(page.getByText(/portal ONR fica instável/i).first()).toBeVisible()
  })

  test('marcar item como pronto risca o nome e atualiza barra', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')

    // Pega checkbox do CNH (1º quick win do cadastro PF)
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

    // Barra sobe (não é mais 0)
    const bar = page.getByRole('progressbar', { name: /progresso/i })
    await expect(bar).not.toHaveAttribute('aria-valuenow', '0')
  })

  test('banner de incentivo à entrevista aparece pra quem não fez', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    // Banner em ouro — heading "checklist personalizado" + CTA
    await expect(page.getByText(/checklist.*personalizado/i).first()).toBeVisible()
    await expect(
      page.getByRole('link', { name: /iniciar entrevista/i }),
    ).toBeVisible()
  })

  test('CTA final "Próxima etapa" + botão Ver planos aparecem', async ({
    autenticado: page,
  }) => {
    await page.goto('/checklist')
    await expect(page.getByText(/análise técnica.*dossiê/i).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /ver planos/i }).first()).toBeVisible()
  })
})
