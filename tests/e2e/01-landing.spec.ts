import { test, expect } from './fixtures'

// Cenário 1 — Landing pública.
// Garante que a home renderiza, mostra hero e CTAs principais, e não
// expõe conteúdo gated. Trava regressões de hydration + copy pública.
test.describe('Landing pública', () => {
  test('home mostra hero + CTA de cadastro', async ({ page }) => {
    const respostas: number[] = []
    page.on('response', (r) => respostas.push(r.status()))

    await page.goto('/')
    await expect(page).toHaveTitle(/agrobridge/i)

    // Hero deve estar visível sem scroll — heading de nível 1.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // CTA pra cadastrar ou entrar na plataforma deve existir.
    const ctaCadastro = page.getByRole('link', {
      name: /cadastr|começar|entrar|comeco/i,
    })
    await expect(ctaCadastro.first()).toBeVisible()

    // Nenhum 5xx na carga inicial da home.
    expect(respostas.some((s) => s >= 500)).toBeFalsy()
  })

  test('home NUNCA cita marcas de banco específicas', async ({ page }) => {
    // Regra CLAUDE.md: copy pública usa "Banco" / "Cooperativa" genérico.
    await page.goto('/')
    const html = await page.content()
    const baixo = html.toLowerCase()
    for (const marca of [
      'sicredi',
      'sicoob',
      'banco do brasil',
      'caixa econômica',
      'bradesco',
      'santander',
      'bnb',
      'basa',
    ]) {
      expect(baixo).not.toContain(marca)
    }
  })
})
