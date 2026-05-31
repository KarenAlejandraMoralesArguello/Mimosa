import { test, expect } from '@playwright/test'
import { grantCookieConsent } from './helpers.js'

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => { await grantCookieConsent(page) })

  test('carga y muestra el CTA principal', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page.locator('a:has-text("Crear cuenta"), button:has-text("Crear cuenta")').first()).toBeVisible()
    await expect(page.locator('a:has-text("Iniciar sesión"), button:has-text("Iniciar sesión")').first()).toBeVisible()
  })

  test('navega a login desde el nav', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/login"], a:has-text("Iniciar sesión")')
    await expect(page).toHaveURL(/\/login/)
  })

  test('ruta desconocida muestra página 404', async ({ page }) => {
    await page.goto('/ruta-que-no-existe')
    await expect(page.locator('text=Página no encontrada')).toBeVisible()
  })
})
