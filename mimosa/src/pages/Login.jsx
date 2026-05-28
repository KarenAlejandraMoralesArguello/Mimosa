import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'
import { findByEmail } from '../data/accounts.js'

const HOME = { brand: '/marca', creator: '/creadora', admin: '/admin' }

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  // El submit SIEMPRE es por JS (preventDefault): nada viaja por la URL.
  // En producción esto llama a supabase.auth.signInWithPassword (HTTPS POST).
  const submit = (e) => {
    e.preventDefault()
    setErr('')
    const acc = findByEmail(email)
    // El portal público SOLO autentica marcas y creadoras.
    // El equipo interno (admin) ingresa por su propio acceso, no desde aquí.
    if (!acc || acc.role === 'admin' || !password) {
      setErr('No encontramos una cuenta con esos datos.')
      return
    }
    // Cuenta suspendida (PRD §7.2).
    if (acc.banned) {
      setErr('Esta cuenta está suspendida. Contacta a soporte por WhatsApp para más información.')
      return
    }
    // El rol viene de la cuenta, no se elige. Define a qué panel entras.
    login(acc)
    navigate(HOME[acc.role])
  }

  const fill = (em) => { setEmail(em); setPassword('demo123'); setErr('') }

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
          <p className="text-muted">Entra con tu correo y contraseña.</p>

          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" className="input" type="email" autoComplete="email"
              placeholder="tucorreo@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <div className="field-row">
              <label htmlFor="password">Contraseña</label>
              <Link to="/recuperar" className="forgot-link">¿Olvidaste tu contraseña?</Link>
            </div>
            <input id="password" className="input" type="password" autoComplete="current-password"
              placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {err && <p className="err" style={{ marginBottom: 14 }}>{err}</p>}

          <button className="btn btn-grad btn-block" type="submit">Entrar</button>

          <div className="demo-hint">
            <span>Cuentas de prueba:</span>
            <button type="button" onClick={() => fill('marca@demo.com')}>Marca demo</button>
            <button type="button" onClick={() => fill('creadora@demo.com')}>Creadora demo</button>
          </div>

          <p className="auth-alt">¿No tienes cuenta? <Link to="/registro">Crear cuenta</Link></p>
        </form>
      </div>
    </div>
  )
}
