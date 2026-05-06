/**
 * TEMPLATE: playwright.config.ts
 *
 * Copiado por /new-project a la raíz del proyecto.
 * Config base — el owner ajusta baseURL y nombres de browsers según el stack.
 *
 * Convención SDD:
 *   - testDir incluye 'e2e/' (suite global) Y 'specs/' (tests trazables a spec.md)
 *   - Tags: @smoke (pre-commit, <30s) | @critical (path principal) | @edge (edge cases)
 *   - Retries solo en CI (en local son ruido)
 *   - Trace y screenshot on-failure: ayudan al healer agent a diagnosticar
 */

import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI

export default defineConfig({
  // Suite global (e2e/) + tests trazables a specs (specs/**/tests.spec.ts)
  testDir: '.',
  testMatch: ['e2e/**/*.spec.ts', 'specs/**/tests.spec.ts'],

  // Sin tests paralelos por archivo en local; sí en CI para velocidad
  fullyParallel: isCI,

  // No permite test.only en CI (catch de tests olvidados)
  forbidOnly: isCI,

  // Retries solo en CI — en local los flaky tests se fixean, no se ocultan
  retries: isCI ? 2 : 0,

  // Workers: paralelismo solo en CI (default de Playwright); local mantiene 1
  // Nota: omitimos `workers` en CI para no romper con tsconfig `exactOptionalPropertyTypes: true`
  ...(isCI ? {} : { workers: 1 }),

  // Reporter: HTML local + line en CI con artefactos
  reporter: isCI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'on-failure' }], ['list']],

  // Settings compartidos
  use: {
    // Reemplazar con la URL real del proyecto (ej: http://localhost:3000)
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',

    // Trace: capturar siempre en CI; on-first-retry en local
    trace: isCI ? 'on' : 'on-first-retry',

    // Screenshot solo cuando un test falla
    screenshot: 'only-on-failure',

    // Video solo en fallas (pesa, no abusar)
    video: 'retain-on-failure',

    // Timeout por acción (click, fill, etc.)
    actionTimeout: 10_000,
  },

  // Browsers a testear. Comentar los que no apliquen al proyecto.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // webkit deshabilitado: Playwright >=1.59 dropeó soporte para macOS 13.
    // Reactivar cuando el owner upgrade a macOS 14+ o cuando radar corra en CI Linux.
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // Mobile viewports (descomentar si el proyecto tiene UI mobile)
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 7'] },
    // },
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 14'] },
    // },
  ],

  // Servidor local para tests E2E
  // Comentar si el proyecto no tiene servidor (ej: librería pura)
  webServer: {
    command: process.env.PLAYWRIGHT_WEB_SERVER_CMD ?? 'npm run dev',
    url: process.env.BASE_URL ?? 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },

  // Output dirs
  outputDir: 'test-results/',

  // Timeout global por test
  timeout: 30_000,

  expect: {
    timeout: 5_000,
  },
})
