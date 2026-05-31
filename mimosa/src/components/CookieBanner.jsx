import { useEffect, useState } from 'react'
import { getCookie, setCookieConsent, analyticsConsent } from '../lib/cookies.js'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    const consent = getCookie('mimosa_cookie_consent')
    const savedAnalytics = analyticsConsent()
    setAnalytics(savedAnalytics)
    setVisible(!consent)
  }, [])

  const acceptAll = () => {
    setCookieConsent(true, true)
    setVisible(false)
  }

  const acceptEssentials = () => {
    setCookieConsent(true, false)
    setVisible(false)
  }

  const rejectAll = () => {
    setCookieConsent(false, false)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner">
      <div className="cookie-content">
        <strong>Usamos cookies para mejorar tu experiencia.</strong>
        <p>
          Guardamos preferencias de navegación y tu elección de cookies. Las cookies esenciales son necesarias para el funcionamiento básico.
          Puedes aceptar todas o solo las esenciales.
        </p>
        <p className="cookie-actions">
          <button className="btn btn-primary" onClick={acceptAll}>Aceptar todo</button>
          <button className="btn btn-ghost" onClick={acceptEssentials}>Solo esenciales</button>
          <button className="btn btn-link" onClick={rejectAll}>Rechazar</button>
        </p>
        <p className="cookie-meta">
          <a href="/privacidad">Ver Política de Privacidad</a>
        </p>
      </div>
    </div>
  )
}
