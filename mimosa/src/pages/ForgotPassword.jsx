import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Logo from '../components/Logo.jsx'
import Icon from '../components/Icon.jsx'

// Recuperación de contraseña vía Supabase Auth.
// Por SEGURIDAD, siempre muestra el mismo mensaje, exista o no la cuenta
// (evita user enumeration — PRD §3).
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Supabase envía el correo con un OTP/magic link de un solo uso.
    // redirectTo debe coincidir con la URL configurada en Supabase → Auth → URL Configuration.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer`,
    })

    // Siempre mostramos éxito — no revelamos si el correo existe o no.
    setSent(true)
    setLoading(false)
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
                Si <strong>{email}</strong> está registrado en Mimosa, te enviamos un enlace
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

          <button className="btn btn-grad btn-block" type="submit" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>

          <p className="auth-alt">
            ¿Te acordaste? <Link to="/login">Iniciar sesión</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
