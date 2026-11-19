import { defineConfig, devices } from '@playwright/test';

/**
 * Testes de ponta a ponta contra o banco LOCAL (supabase start + seed).
 * Local: site rodando (npm run dev:web) e `npx playwright test` (usa o Chrome instalado).
 * CI: o workflow sobe o Supabase, faz o build e o config inicia o servidor.
 */
const CI = Boolean(process.env.CI);
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    ...devices['Pixel 7'],
    ...(CI ? {} : { channel: 'chrome' }),
  },
  webServer: CI ? { command: 'npm run start -w web', url: 'http://localhost:3000', timeout: 120_000, reuseExistingServer: false } : undefined,
});
