import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'
import Icon from '../components/Icon.jsx'
import { PLANS } from '../data/mock.js'
import { registerAccount } from '../data/accounts.js'

export default function Register() {
  // El rol se DERIVA de la URL (no de useState), así el formulario se
  // re-renderiza al instante cuando cambias entre marca y creadora.
  const [params, setParams] = useSearchParams()
  const rol = params.get('rol')
  const role = rol === 'creadora' ? 'creator' : rol === 'marca' ? 'brand' : null
  const pick = (r) => setParams({ rol: r })

  if (!role) return <RolePicker onPick={pick} />
  return role === 'brand'
    ? <BrandForm onSwitch={() => pick('creadora')} />
    : <CreatorForm onSwitch={() => pick('marca')} />
}

function RolePicker({ onPick }) {
  return (
    <div className="auth single">
      <div className="auth-form-wrap full">
        <div className="auth-form wide">
          <Link to="/" className="auth-back"><Logo /></Link>
          <h1>Crea tu cuenta</h1>
          <p className="text-muted">¿Cómo quieres usar Mimosa Colab Club?</p>
          <div className="role-cards">
            <button className="role-card" style={{ '--g': 'var(--grad-rosa-violeta)' }} onClick={() => onPick('marca')}>
              <span className="role-icon"><Icon name="building" size={28} color="#fff" /></span>
              <h3>Soy una marca</h3>
              <p>Quiero publicar campañas y reclutar creadoras de UGC.</p>
              <span className="role-go">Continuar →</span>
            </button>
            <button className="role-card" style={{ '--g': 'var(--grad-solar-rosa)' }} onClick={() => onPick('creadora')}>
              <span className="role-icon"><Icon name="palette" size={28} color="#fff" /></span>
              <h3>Soy creadora</h3>
              <p>Quiero aplicar a campañas y cobrar por mi contenido.</p>
              <span className="role-go">Continuar →</span>
            </button>
          </div>
          <p className="auth-alt">¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link></p>
        </div>
      </div>
    </div>
  )
}

function BrandForm({ onSwitch }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [plan, setPlan] = useState('starter')
  const [form, setForm] = useState({ company: '', email: '', password: '' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    // El rol 'brand' queda guardado en la cuenta (futura tabla `perfiles`).
    const account = { email: form.email || 'marca@demo.com', role: 'brand', name: form.company || 'Mi Marca', plan }
    registerAccount(account)
    login(account)
    navigate('/marca')
  }

  return (
    <AuthScaffold title="Registro de marca" subtitle="Configura tu cuenta y elige tu plan de suscripción.">
      <form onSubmit={submit}>
        <div className="field">
          <label>Nombre comercial de la marca</label>
          <input className="input" required value={form.company} onChange={set('company')} placeholder="Ej. Lumière Skincare" />
        </div>
        <div className="field">
          <label>Correo corporativo</label>
          <input className="input" type="email" autoComplete="email" required value={form.email} onChange={set('email')} placeholder="hola@marca.com" />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input className="input" type="password" autoComplete="new-password" required value={form.password} onChange={set('password')} placeholder="••••••••" />
        </div>

        <div className="field">
          <label>Elige tu plan</label>
          <div className="plan-pick">
            {PLANS.map((p) => (
              <label key={p.id} className={`plan-pick-opt${plan === p.id ? ' is-on' : ''}`}>
                <input type="radio" name="plan" checked={plan === p.id} onChange={() => setPlan(p.id)} />
                <span className="ppo-name">{p.name}</span>
                <span className="ppo-price">${p.price} MXN/mes</span>
                <span className="ppo-limit">{p.limit}</span>
              </label>
            ))}
          </div>
          <p className="hint">Inicias con prueba gratuita controlada. No hay plan perpetuo gratuito.</p>
        </div>

        <button className="btn btn-grad btn-block" type="submit">Crear cuenta de marca</button>
        <p className="auth-alt">¿Eres creadora? <button type="button" className="link-btn" onClick={onSwitch}>Regístrate aquí</button></p>
      </form>
    </AuthScaffold>
  )
}

function CreatorForm({ onSwitch }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', portfolio: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    // PRD §6.1: portafolio externo obligatorio.
    if (!/^https?:\/\/.+\..+/.test(form.portfolio.trim())) {
      setErr('Ingresa un enlace válido a tu portafolio (Behance, Canva, Drive, TikTok…).')
      return
    }
    // El rol 'creator' y el estado "en validación" quedan en la cuenta.
    const account = { email: form.email || 'creadora@demo.com', role: 'creator', name: form.name || 'Nueva Creadora', status: 'en_validacion', portfolio: form.portfolio }
    registerAccount(account)
    login(account)
    navigate('/creadora')
  }

  return (
    <AuthScaffold title="Registro de creadora" subtitle="Tu cuenta entrará en validación tras enviar tu portafolio.">
      <form onSubmit={submit}>
        <div className="field">
          <label>Nombre o nombre artístico</label>
          <input className="input" required value={form.name} onChange={set('name')} placeholder="Ej. Valentina Ríos" />
        </div>
        <div className="field">
          <label>Correo electrónico</label>
          <input className="input" type="email" autoComplete="email" required value={form.email} onChange={set('email')} placeholder="tu@correo.com" />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input className="input" type="password" autoComplete="new-password" required value={form.password} onChange={set('password')} placeholder="••••••••" />
        </div>
        <div className="field">
          <label>Enlace a tu portafolio externo *</label>
          <input className="input" value={form.portfolio} onChange={set('portfolio')} placeholder="https://behance.net/tuperfil" />
          {err ? <p className="err">{err}</p> : <p className="hint">Obligatorio. Behance, Canva, Drive, TikTok, etc. Lo revisamos manualmente.</p>}
        </div>

        <div className="info-banner">
          <strong>¿Qué sigue?</strong> Tu cuenta quedará <em>En validación</em>. Un admin revisa tu portafolio y, al aprobarte, capturas tu CLABE para recibir pagos.
        </div>

        <button className="btn btn-grad btn-block" type="submit">Enviar para validación</button>
        <p className="auth-alt">¿Eres marca? <button type="button" className="link-btn" onClick={onSwitch}>Regístrate aquí</button></p>
      </form>
    </AuthScaffold>
  )
}

function AuthScaffold({ title, subtitle, children }) {
  return (
    <div className="auth single">
      <div className="auth-form-wrap full">
        <div className="auth-form wide">
          <Link to="/" className="auth-back"><Logo /></Link>
          <h1>{title}</h1>
          <p className="text-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
