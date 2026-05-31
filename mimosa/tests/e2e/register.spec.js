import { test, expect } from '@playwright/test'
import { grantCookieConsent } from './helpers.js'

test.describe('Registro', () => {
  test.beforeEach(async ({ page }) => { await grantCookieConsent(page) })

  test('formulario de marca muestra errores si se envía vacío', async ({ page }) => {
    await page.goto('/registro')
    // Paso 1: elegir rol
    await page.click('button.role-card:has-text("Marca")')
    // Paso 2: enviar vacío
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/registro/)
    await expect(page.locator('p.err').first()).toBeVisible({ timeout: 3000 })
  })

  test('muestra error si el email de marca ya está registrado', async ({ page }) => {
    await page.goto('/registro')
    await page.click('button.role-card:has-text("Marca")')
    await page.waitForSelector('input[type="email"]', { timeout: 5000 })

    await page.fill('input[placeholder="Ej. Lumière Skincare"]', 'Test Marca')
    await page.fill('input[placeholder="hola@marca.com"]', 'admin@mimosa.com')
    await page.fill('input[type="password"]', 'Password123!')
    await page.click('button[type="submit"]')

    await expect(page.locator('p.err')).toContainText('Ya existe una cuenta con ese correo.', { timeout: 10000 })
  })
})
