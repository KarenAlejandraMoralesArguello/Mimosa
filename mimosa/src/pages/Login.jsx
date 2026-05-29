import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

const HOME = { brand: '/marca', creator: '/creadora', admin: '/admin' }

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const needsConfirm = searchParams.get('confirmar') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      setErr('No encontramos una cuenta con esos datos.')
      setLoading(false)
      return
    }

    // Carga el perfil para obtener rol y estado de baneo.
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

    // El portal público NO autentica admins (PRD §8).
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
        <form className="auth-form" onSubmit={submit}>
          <h1>Iniciar sesión</h1>
          {needsConfirm && (
            <div className="info-banner" style={{ marginBottom: 14 }}>
              <strong>Confirma tu correo.</strong> Te enviamos un enlace de verificación. Una vez confirmado, inicia sesión aquí.
            </div>
          )}
          <p className="text-muted">Entra con tu correo y contraseña.</p>

          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" className="input" type="email" autoComplete="email"
              placeholder="tucorreo@empresa.com" value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <div className="field-row">
              <label htmlFor="password">Contraseña</label>
              <Link to="/recuperar" className="forgot-link">¿Olvidaste tu contraseña?</Link>
            </div>
            <input id="password" className="input" type="password" autoComplete="current-password"
              placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} />
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
