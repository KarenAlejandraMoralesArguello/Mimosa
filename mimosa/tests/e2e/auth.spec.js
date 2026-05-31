import { test, expect } from '@playwright/test'
import { grantCookieConsent } from './helpers.js'

test.describe('Auth — Login', () => {
  test.beforeEach(async ({ page }) => { await grantCookieConsent(page) })

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'noexiste@mail.com')
    await page.fill('input[type="password"]', 'Wrongpass1')
    await page.click('button:has-text("Entrar")')
    await expect(page.locator('p.err')).toContainText('No encontramos una cuenta con esos datos.', { timeout: 10000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirige /creadora a /login si no hay sesión', async ({ page }) => {
    await page.goto('/creadora')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('redirige /marca a /login si no hay sesión', async ({ page }) => {
    await page.goto('/marca')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('redirige /admin a /login si no hay sesión', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
})

test.describe('Auth — Staff Login', () => {
  test.beforeEach(async ({ page }) => { await grantCookieConsent(page) })

  test('muestra error con contraseña incorrecta', async ({ page }) => {
    await page.goto('/acceso-staff')
    await page.fill('#se', 'admin@mimosa.com')
    await page.fill('#sp', 'password-incorrecta')
    await page.click('button:has-text("Ingresar")')
    await expect(page.locator('p.err')).toContainText('Credenciales inválidas.', { timeout: 10000 })
    await expect(page).toHaveURL(/\/acceso-staff/)
  })

  test('admin entra al panel con credenciales correctas', async ({ page }) => {
    await page.goto('/acceso-staff')
    await page.fill('#se', 'admin@mimosa.com')
    await page.fill('#sp', 'prueba1234')
    await page.click('button:has-text("Ingresar")')
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
    await expect(page.locator('button:has-text("Validar creadoras")')).toBeVisible()
  })
})
