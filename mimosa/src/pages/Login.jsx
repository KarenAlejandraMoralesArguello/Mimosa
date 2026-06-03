import { useState } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

const HOME = { brand: '/marca', creator: '/creadora', admin: '/admin' }

// Regex de email: sin espacios, exactamente un @, dominio con al menos 2 chars.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const needsConfirm = searchParams.get('confirmar') === '1'
  const isBanned   = location.state?.banned
  const banReason  = location.state?.banReason

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [err, setErr]           = useState('')
  const [loading, setLoading]   = useState(false)

  const validateEmail = (val) => {
    if (!val) { setEmailErr('El correo es obligatorio.'); return false }
    if (!EMAIL_RE.test(val)) { setEmailErr('Ingresa un correo válido (ej. nombre@dominio.com).'); return false }
    setEmailErr('')
    return true
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!validateEmail(email)) return
    if (!password) { setErr('Ingresa tu contraseña.'); return }

    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      setErr('No encontramos una cuenta con esos datos.')
      setLoading(false)
      return
    }

    const { data: perfil, error: perfilErr } = await supabase
      .from('perfiles')
      .select('rol, banned')
      .eq('id', data.session.user.id)
      .single()

    if (perfilErr || !perfil) {
      setErr('Error al cargar tu perfil. Intenta de nuevo.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (perfil.rol === 'admin') {
      setErr('No encontramos una cuenta con esos datos.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (perfil.banned) {
      setErr('Esta cuenta está suspendida. Contacta a soporte por WhatsApp para más información.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    await login(data.session)
    navigate(HOME[perfil.rol])
  }

  if (isBanned) {
    return (
      <div className="auth">
        <div className="auth-aside">
          <Link to="/"><Logo light /></Link>
          <h2>Cuenta suspendida.</h2>
          <p>Si crees que es un error, escríbenos y lo resolvemos.</p>
          <div className="auth-aside-art" />
        </div>
        <div className="auth-form-wrap">
          <div className="auth-form">
            <h1>Tu cuenta fue suspendida</h1>
            <div className="info-banner" style={{ borderColor: 'var(--naranja, #f97316)', background: 'rgba(249,115,22,.08)', marginBottom: 20 }}>
              <strong>Acceso bloqueado.</strong> Esta cuenta no puede iniciar sesión en este momento.
            </div>
            {banReason && (
              <div style={{ marginBottom: 20 }}>
                <p className="text-muted" style={{ fontSize: 13, marginBottom: 4 }}>Motivo indicado por el equipo Mimosa:</p>
                <p style={{ fontStyle: 'italic' }}>"{banReason}"</p>
              </div>
            )}
            <p className="text-muted" style={{ marginBottom: 20 }}>
              Si crees que esto es un error o quieres apelar la decisión, escríbenos directamente por WhatsApp o correo y revisamos tu caso.
            </p>
            <a
              className="btn btn-grad btn-block"
              href="https://wa.me/528125706387?text=Hola%20Mimosa%2C%20mi%20cuenta%20fue%20suspendida%20y%20quisiera%20apelar%20la%20decision"
              target="_blank"
              rel="noreferrer"
              style={{ marginBottom: 12 }}
            >
              Contactar por WhatsApp
            </a>
            <a
              className="btn btn-ghost btn-block"
              href="mailto:soporte@mimosacolab.com?subject=Apelación%20de%20suspensión"
            >
              Enviar correo a soporte
            </a>
            <p className="auth-alt" style={{ marginTop: 24 }}>
              <Link to="/">Volver al inicio</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth">
      <div className="auth-aside">
        <Link to="/"><Logo light /></Link>
        <h2>Bienvenida de vuelta al club.</h2>
        <p>Tus campañas, postulaciones y pagos en escrow, en un solo lugar.</p>
        <div className="auth-aside-art" />
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit} noValidate>
          <h1>Iniciar sesión</h1>
          {needsConfirm && (
            <div className="info-banner" style={{ marginBottom: 14 }}>
              <strong>Confirma tu correo.</strong> Te enviamos un enlace de verificación. Una vez confirmado, inicia sesión aquí.
            </div>
          )}
          <p className="text-muted">Entra con tu correo y contraseña.</p>

          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              className={'input' + (emailErr ? ' input-error' : '')}
              type="email"
              autoComplete="email"
              placeholder="tucorreo@empresa.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailErr) validateEmail(e.target.value) }}
              onBlur={(e) => validateEmail(e.target.value)}
            />
            {emailErr && <p className="err">{emailErr}</p>}
          </div>

          <div className="field">
            <div className="field-row">
              <label htmlFor="password">Contraseña</label>
              <Link to="/recuperar" className="forgot-link">¿Olvidaste tu contraseña?</Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {err && <p className="err" style={{ marginBottom: 14 }}>{err}</p>}

          <button className="btn btn-grad btn-block" type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="auth-alt">¿No tienes cuenta? <Link to="/registro">Crear cuenta</Link></p>
        </form>
      </div>
    </div>
  )
}
