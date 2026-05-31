// Utilidades sencillas de cookies para el frontend.
// Estas funciones usan cookies estrictamente del lado del navegador.

export function setCookie(name, value, days = 365, path = '/') {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  const safeValue = encodeURIComponent(value)
  document.cookie = `${name}=${safeValue}; expires=${expires}; path=${path}; SameSite=Lax`;
}

export function getCookie(name) {
  const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
    const [key, ...rest] = cookie.split('=')
    acc[key] = rest.join('=')
    return acc
  }, {})
  return cookies[name] ? decodeURIComponent(cookies[name]) : null
}

export function deleteCookie(name, path = '/') {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=Lax`;
}

export function setCookieConsent(accepted, analytics = false) {
  setCookie('mimosa_cookie_consent', accepted ? 'accepted' : 'denied', 365)
  setCookie('mimosa_analytics', analytics ? 'true' : 'false', 365)
}

export function hasCookieConsent() {
  return getCookie('mimosa_cookie_consent') === 'accepted'
}

export function analyticsConsent() {
  return getCookie('mimosa_analytics') === 'true'
}
