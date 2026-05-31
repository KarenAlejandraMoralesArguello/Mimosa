/**
 * Pre-establece la cookie de consentimiento antes de navegar,
 * para que el CookieBanner nunca aparezca en tests.
 * Llamar ANTES de page.goto().
 */
export async function grantCookieConsent(page) {
  await page.context().addCookies([
    {
      name: 'mimosa_cookie_consent',
      value: 'accepted',
      domain: 'localhost',
      path: '/',
      expires: Date.now() / 1000 + 365 * 24 * 3600,
    },
    {
      name: 'mimosa_analytics',
      value: 'false',
      domain: 'localhost',
      path: '/',
      expires: Date.now() / 1000 + 365 * 24 * 3600,
    },
  ])
}
