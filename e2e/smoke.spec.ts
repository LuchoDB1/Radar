/**
 * Radar — smoke E2E
 *
 * Confirma que el servidor arranca y la home renderiza el header.
 * Corre en pre-commit (debe ser <30s total).
 *
 * REQUISITO: .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
 * configurados. Sin esto, el SSR de app/page.tsx tira error al consultar DB.
 * Si las env no están seteadas en el ambiente, los tests skip-ean (no fallan).
 */

import { test, expect } from '@playwright/test'

const HAS_ENV = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

test.describe('smoke @smoke', () => {
  test.skip(!HAS_ENV, 'requires .env.local with Supabase env vars')

  test('la home carga y muestra el header de Radar AI', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.ok()).toBe(true)

    // Header siempre presente, viene del Server Component
    await expect(page.getByRole('heading', { name: /Radar AI/i })).toBeVisible()
  })

  test('el badge de caché es visible @smoke', async ({ page }) => {
    await page.goto('/')
    // Badge "Caché · 1h" en el header — comunica el invariante de revalidate=3600
    await expect(page.getByText(/Caché.*1h/i)).toBeVisible()
  })
})
