import { test, expect } from './fixtures'

// Cenário 10 — Widget IA flutuante.
// User autenticado E2E é Free → vê FAB com ícone de cadeado e clique
// abre modal de upgrade (não o chat).
//
// Free não testamos os estados open/minimized/pílula porque exigem
// tier Bronze+ — fica pra spec dedicada quando tivermos user paying
// no E2E.

test.describe('Widget IA (Free)', () => {
  test('FAB visível em /dashboard com ícone de cadeado', async ({
    autenticado: page,
  }) => {
    await page.goto('/dashboard')

    // FAB com aria-label "Abrir chat IA"
    const fab = page.getByRole('button', { name: /abrir chat ia/i })
    await expect(fab).toBeVisible()
  })

  test('clique no FAB abre modal de upgrade (Free)', async ({
    autenticado: page,
  }) => {
    await page.goto('/dashboard')

    await page.getByRole('button', { name: /abrir chat ia/i }).click()

    // Modal de upgrade
    await expect(
      page.getByRole('heading', { name: /disponível a partir do bronze/i }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /ver planos/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^fechar$/i })).toBeVisible()
  })

  test('botão Fechar do modal volta pra dashboard', async ({
    autenticado: page,
  }) => {
    await page.goto('/dashboard')

    await page.getByRole('button', { name: /abrir chat ia/i }).click()
    await expect(
      page.getByRole('heading', { name: /disponível a partir do bronze/i }),
    ).toBeVisible()

    await page.getByRole('button', { name: /^fechar$/i }).click()
    await expect(
      page.getByRole('heading', { name: /disponível a partir do bronze/i }),
    ).not.toBeVisible()
  })

  test('FAB persiste em diferentes rotas autenticadas', async ({
    autenticado: page,
  }) => {
    // Conta dados — widget deve aparecer
    await page.goto('/conta/dados')
    await expect(
      page.getByRole('button', { name: /abrir chat ia/i }),
    ).toBeVisible()

    // Planos
    await page.goto('/planos')
    await expect(
      page.getByRole('button', { name: /abrir chat ia/i }),
    ).toBeVisible()

    // Checklist genérico
    await page.goto('/checklist')
    await expect(
      page.getByRole('button', { name: /abrir chat ia/i }),
    ).toBeVisible()
  })

  test('widget escondido em /entrevista (rota com chat dedicado)', async ({
    autenticado: page,
  }) => {
    await page.goto('/entrevista')

    // FAB NÃO deve aparecer (DashboardShell.rotaSemWidget cobre /entrevista)
    await expect(
      page.getByRole('button', { name: /abrir chat ia/i }),
    ).not.toBeVisible()
  })
})
