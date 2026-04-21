import { test, expect } from './fixtures'

// Cenário 7 — Regressão de produção (hotfix/chat-messages-sanitize).
// Bug: /api/chat selecionava `created_at` do DB e mandava direto pro
// Anthropic SDK. A 1ª msg passava (histórico vazio), a 2ª quebrava com
// 400 invalid_request_error: "messages.0.created_at: Extra inputs are
// not permitted".
//
// Esse spec exercita 2 turnos sequenciais via UI e garante que o erro
// "Falha na IA" NÃO aparece na DOM (ChatClient renderiza num bloco
// vermelho com data-icon=alert se algo falha).
//
// Pré-requisitos: ANTHROPIC_API_KEY no env do dev server. Seed precisa
// ter rodado pra zerar contador freemium (senão paywall na 2ª msg).

test.describe('Chat IA · 2 mensagens sequenciais (regressão sanitize)', () => {
  test('manda 2 msgs e nenhuma resposta volta como "Falha na IA"', async ({
    autenticado: page,
  }) => {
    test.setTimeout(120_000)

    await page.goto('/entrevista')

    const input = page.getByPlaceholder(/digite sua resposta/i)
    await expect(input).toBeVisible()
    await expect(input).toBeEnabled()

    // 1ª msg
    await input.fill('Quero custeio de soja, 200 ha em MS.')
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/chat') && r.request().method() === 'POST',
        { timeout: 30_000 }
      ),
      page.getByRole('button', { name: /enviar mensagem/i }).click(),
    ])
    // Espera o stream terminar (input volta a ficar habilitado)
    await expect(input).toBeEnabled({ timeout: 60_000 })

    // 2ª msg — antes do hotfix, era aqui que estourava 400
    await input.fill('Já tomei custeio em 2024, valor R$ 180 mil.')
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/chat') && r.request().method() === 'POST',
        { timeout: 30_000 }
      ),
      page.getByRole('button', { name: /enviar mensagem/i }).click(),
    ])
    await expect(input).toBeEnabled({ timeout: 60_000 })

    // Garantia: nenhuma forma de "Falha na IA" na DOM (banner de erro do
    // ChatClient + mensagem inline do stream).
    await expect(page.getByText(/falha na ia/i)).toHaveCount(0)
    await expect(page.getByText(/extra inputs are not permitted/i)).toHaveCount(0)
  })
})
