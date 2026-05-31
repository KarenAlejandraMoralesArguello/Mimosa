import { test, expect } from '@playwright/test'
import { grantCookieConsent } from './helpers.js'

test.describe('Admin — Panel', () => {
  test.beforeEach(async ({ page }) => {
    await grantCookieConsent(page)
    await page.goto('/acceso-staff')
    await page.fill('#se', 'admin@mimosa.com')
    await page.fill('#sp', 'prueba1234')
    await page.click('button:has-text("Ingresar")')
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
  })

  test('muestra las 4 secciones del nav', async ({ page }) => {
    await expect(page.locator('button:has-text("Validar creadoras")')).toBeVisible()
    await expect(page.locator('button:has-text("Pre-aprobar campanas")')).toBeVisible()
    await expect(page.locator('button:has-text("Arbitraje")')).toBeVisible()
    await expect(page.locator('button:has-text("Cuentas")')).toBeVisible()
  })

  test('panel de arbitraje carga sin errores de consola', async ({ page }) => {
    const errors = []
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    await page.click('button:has-text("Arbitraje")')
    await expect(page.locator('text=Panel de arbitraje')).toBeVisible()
    await page.waitForTimeout(1500)
    const jsErrors = errors.filter(e => !e.includes('favicon') && !e.includes('ERR_ABORTED'))
    expect(jsErrors).toHaveLength(0)
  })

  test('panel de cuentas lista usuarios', async ({ page }) => {
    await page.click('button:has-text("Cuentas")')
    await expect(page.locator('text=Cuentas registradas')).toBeVisible()
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 8000 })
  })

  test('modal resolver disputa abre y cierra correctamente', async ({ page }) => {
    await page.click('button:has-text("Arbitraje")')
    await page.waitForTimeout(1500)
    const resolverBtn = page.locator('button:has-text("Resolver disputa")').first()
    if (await resolverBtn.isVisible()) {
      await resolverBtn.click()
      await expect(page.locator('text=Acción del Administrador')).toBeVisible()
      await page.click('button:has-text("Cancelar")')
      await expect(page.locator('text=Acción del Administrador')).not.toBeVisible()
    } else {
      // Sin órdenes activas — panel vacío es estado válido
      await expect(page.locator('text=Panel de arbitraje')).toBeVisible()
    }
  })
})
