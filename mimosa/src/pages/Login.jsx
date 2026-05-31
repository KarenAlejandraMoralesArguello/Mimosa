import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const needsConfirm = searchParams.get('confirmar') === '1'

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
