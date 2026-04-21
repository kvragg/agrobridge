import { defineConfig, devices } from '@playwright/test'

// Rodar local:
//   npm install
//   npx playwright install --with-deps chromium
//   cp .env.local .env.e2e        # ou setar E2E_BASE_URL/E2E_TEST_EMAIL etc
//   node tests/e2e/seed.ts        # cria/mantém usuário de teste
//   npm run test:e2e
//
// Em CI (Linux) funciona direto. No Win o WDAC bloqueia os binários do
// Playwright — rodar por WSL/container.

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
