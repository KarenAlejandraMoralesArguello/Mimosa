import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import Icon from '../components/Icon.jsx'
import { findByEmail } from '../data/accounts.js'

// Recuperación de contraseña.
// En producción esto llama a supabase.auth.resetPasswordForEmail(email, {
//   redirectTo: 'https://app.mimosa.club/restablecer'
// }) que envía un correo con un token de un solo uso.
//
// Por SEGURIDAD, la pantalla SIEMPRE muestra el mismo mensaje, exista o no
// la cuenta, para no revelar si un correo está registrado (evita user enumeration).
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    // En la demo simulamos el envío. Comportamiento real va por Supabase.
    // Verificamos internamente solo para que el demo "sepa" si existe,
    // pero el mensaje al usuario no lo revela.
    const acc = findByEmail(email)
    // Bloqueo extra: el portal público nunca dispara reset para cuentas admin.
    if (acc && acc.role === 'admin') {
      setSent(true) // mismo mensaje, sin enviar nada
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="auth single">
        <div className="auth-form-wrap full">
          <div className="auth-form">
            <Link to="/" className="auth-back"><Logo /></Link>
            <div className="reset-success">
              <div className="done-check"><Icon name="check" size={28} color="var(--verde)" strokeWidth={3} /></div>
              <h1>Revisa tu correo</h1>
              <p className="text-muted">
                Si <strong>{email || 'tu correo'}</strong> está registrado en Mimosa, te enviamos un enlace
                para restablecer tu contraseña. Revisa también la carpeta de spam.
              </p>
              <p className="hint">El enlace expira en 60 minutos por seguridad.</p>
              <Link to="/login" className="btn btn-grad btn-block" style={{ marginTop: 18 }}>Volver a iniciar sesión</Link>
              <button type="button" className="link-btn" style={{ marginTop: 14 }} onClick={() => setSent(false)}>Probar con otro correo</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth single">
      <div className="auth-form-wrap full">
        <form className="auth-form" onSubmit={submit}>
          <Link to="/" className="auth-back"><Logo /></Link>
          <h1>Recupera tu acceso</h1>
          <p className="text-muted">Ingresa el correo con el que creaste tu cuenta y te enviaremos un enlace para crear una nueva contraseña.</p>

          <div className="field" style={{ marginTop: 18 }}>
            <label htmlFor="rmail">Correo electrónico</label>
            <input id="rmail" className="input" type="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@empresa.com" />
          </div>

          <button className="btn btn-grad btn-block" type="submit">Enviar enlace</button>

          <p className="auth-alt">
            ¿Te acordaste? <Link to="/login">Iniciar sesión</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
