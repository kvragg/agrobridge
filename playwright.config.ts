import { defineConfig, devices } from '@playwright/test'

// Rodar local:
//   npm install
//   npx playwright install --with-deps chromium
//   cp .env.local .env.e2e        # ou setar E2E_BASE_URL/E2E_TEST_EMAIL etc
//   node --env-file=.env.local --import tsx tests/e2e/seed.ts
//   npm run test:e2e
//
// Em CI (Linux) funciona direto. No Win o WDAC bloqueia os binários do
// Playwright — rodar por WSL/container.

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const storageState = 'tests/e2e/.auth/user.json'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Serial evita login concorrente hitting /api/auth/login rate-limit.
  workers: 1,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
  },
  projects: [
    // 1. Setup: loga uma única vez e salva storageState.
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // 2. Specs anônimos (sem auth): landing + auth-gate + signup.
    {
      name: 'anonimo',
      testMatch: /(01-landing|02-signup-enumeracao|03-auth-gate)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // 3. Specs autenticados: carregam o storageState do setup.
    {
      name: 'autenticado',
      testMatch: /(04-planos|05-conta-dados|06-dashboard-free|07-chat-2-msgs|08-simulador)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState,
      },
      dependencies: ['setup'],
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
