import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'
import { sendEmail } from '../lib/email.js'
import Icon from '../components/Icon.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import { PLANS } from '../data/mock.js'

// Regex de email: sin espacios, exactamente un @, dominio con al menos 2 chars.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Reglas de contraseña compartidas
function validatePassword(pwd) {
  if (!pwd)               return 'La contraseña es obligatoria.'
  if (pwd.length < 8)     return 'Mínimo 8 caracteres.'
  if (!/[A-Za-z]/.test(pwd)) return 'Debe incluir al menos una letra.'
  if (!/\d/.test(pwd))    return 'Debe incluir al menos un número.'
  return ''
}

function validateEmail(email) {
  if (!email)              return 'El correo es obligatorio.'
  if (!EMAIL_RE.test(email)) return 'Formato inválido (ej. nombre@dominio.com).'
  return ''
}

export default function Register() {
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
  const [errors, setErrors] = useState({})
  const [serverErr, setServerErr] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  // Valida un campo individual al salir (blur)
  const touch = (k, val) => {
    const e = { ...errors }
    if (k === 'company') e.company = val.trim() ? '' : 'El nombre comercial es obligatorio.'
    if (k === 'email')   e.email   = validateEmail(val)
    if (k === 'password') e.password = validatePassword(val)
    setErrors(e)
  }

  // Valida todos los campos antes de enviar
  const validate = () => {
    const e = {
      company:  form.company.trim() ? '' : 'El nombre comercial es obligatorio.',
      email:    validateEmail(form.email),
      password: validatePassword(form.password),
    }
    setErrors(e)
    return !Object.values(e).some(Boolean)
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerErr('')
    if (!validate()) return

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { rol: 'brand', nombre: form.company } },
    })

    if (error) {
      const msg = error.message
      if (msg === 'User already registered')  setServerErr('Ya existe una cuenta con ese correo.')
      else if (msg?.includes('invalid'))      setServerErr('El correo no es válido.')
      else if (msg?.includes('rate limit'))   setServerErr('Demasiados intentos. Espera unos minutos.')
      else                                    setServerErr('Error al crear la cuenta. Intenta de nuevo.')
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (userId) {
      await supabase.rpc('registrar_marca', {
        p_perfil_id:        userId,
        p_nombre_comercial: form.company,
        p_plan:             plan,
      })
    }

    if (!data.session) { navigate('/login?confirmar=1'); return }
    await login(data.session)
    sendEmail('bienvenida_marca', form.email, { nombre: form.company })
    navigate('/marca')
  }

  return (
    <AuthScaffold title="Registro de marca" subtitle="Configura tu cuenta y elige tu plan de suscripción.">
      <form onSubmit={submit} noValidate>

        <div className="field">
          <label>Nombre comercial de la marca <span className="req">*</span></label>
          <input
            className={'input' + (errors.company ? ' input-error' : '')}
            value={form.company}
            onChange={set('company')}
            onBlur={(e) => touch('company', e.target.value)}
            placeholder="Ej. Lumière Skincare"
          />
          {errors.company && <p className="err">{errors.company}</p>}
        </div>

        <div className="field">
          <label>Correo corporativo <span className="req">*</span></label>
          <input
            className={'input' + (errors.email ? ' input-error' : '')}
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => { set('email')(e); if (errors.email) touch('email', e.target.value) }}
            onBlur={(e) => touch('email', e.target.value)}
            placeholder="hola@marca.com"
          />
          {errors.email && <p className="err">{errors.email}</p>}
        </div>

        <div className="field">
          <label>Contraseña <span className="req">*</span></label>
          <PasswordInput
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => { set('password')(e); if (errors.password) touch('password', e.target.value) }}
            onBlur={(e) => touch('password', e.target.value)}
            placeholder="Mínimo 8 caracteres con letras y números"
          />
          {errors.password
            ? <p className="err">{errors.password}</p>
            : <p className="hint">Mínimo 8 caracteres, al menos una letra y un número.</p>
          }
        </div>

        <div className="field">
          <label>Elige tu plan <span className="req">*</span></label>
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

        {serverErr && <p className="err" style={{ marginBottom: 14 }}>{serverErr}</p>}

        <button className="btn btn-grad btn-block" type="submit" disabled={loading}>
          {loading ? 'Creando cuenta…' : 'Crear cuenta de marca'}
        </button>
        <p className="auth-alt">¿Eres creadora? <button type="button" className="link-btn" onClick={onSwitch}>Regístrate aquí</button></p>
      </form>
    </AuthScaffold>
  )
}

function CreatorForm({ onSwitch }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', portfolio: '' })
  const [errors, setErrors] = useState({})
  const [serverErr, setServerErr] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const touch = (k, val) => {
    const e = { ...errors }
    if (k === 'name')      e.name      = val.trim() ? '' : 'El nombre es obligatorio.'
    if (k === 'email')     e.email     = validateEmail(val)
    if (k === 'password')  e.password  = validatePassword(val)
    if (k === 'portfolio') {
      if (!val.trim()) e.portfolio = 'El enlace al portafolio es obligatorio.'
      else if (!/^https?:\/\/.+\..+/.test(val.trim())) e.portfolio = 'Ingresa un enlace válido (https://…).'
      else e.portfolio = ''
    }
    setErrors(e)
  }

  const validate = () => {
    const port = form.portfolio.trim()
    const e = {
      name:      form.name.trim()  ? '' : 'El nombre es obligatorio.',
      email:     validateEmail(form.email),
      password:  validatePassword(form.password),
      portfolio: !port
        ? 'El enlace al portafolio es obligatorio.'
        : !/^https?:\/\/.+\..+/.test(port)
          ? 'Ingresa un enlace válido (https://…).'
          : '',
    }
    setErrors(e)
    return !Object.values(e).some(Boolean)
  }

  const submit = async (e) => {
    e.preventDefault()
    setServerErr('')
    if (!validate()) return

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { rol: 'creator', nombre: form.name } },
    })

    if (error) {
      const msg = error.message
      if (msg === 'User already registered')  setServerErr('Ya existe una cuenta con ese correo.')
      else if (msg?.includes('invalid'))      setServerErr('El correo no es válido.')
      else if (msg?.includes('rate limit'))   setServerErr('Demasiados intentos. Espera unos minutos.')
      else                                    setServerErr('Error al crear la cuenta. Intenta de nuevo.')
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (userId) {
      await supabase.rpc('registrar_creadora', {
        p_perfil_id:      userId,
        p_portafolio_url: form.portfolio.trim(),
      })
    }

    if (!data.session) { navigate('/login?confirmar=1'); return }
    await login(data.session)
    sendEmail('bienvenida_creadora', form.email, { nombre: form.name })
    navigate('/creadora')
  }

  return (
    <AuthScaffold title="Registro de creadora" subtitle="Tu cuenta entrará en validación tras enviar tu portafolio.">
      <form onSubmit={submit} noValidate>

        <div className="field">
          <label>Nombre o nombre artístico <span className="req">*</span></label>
          <input
            className={'input' + (errors.name ? ' input-error' : '')}
            value={form.name}
            onChange={set('name')}
            onBlur={(e) => touch('name', e.target.value)}
            placeholder="Ej. Valentina Ríos"
          />
          {errors.name && <p className="err">{errors.name}</p>}
        </div>

        <div className="field">
          <label>Correo electrónico <span className="req">*</span></label>
          <input
            className={'input' + (errors.email ? ' input-error' : '')}
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => { set('email')(e); if (errors.email) touch('email', e.target.value) }}
            onBlur={(e) => touch('email', e.target.value)}
            placeholder="tu@correo.com"
          />
          {errors.email && <p className="err">{errors.email}</p>}
        </div>

        <div className="field">
          <label>Contraseña <span className="req">*</span></label>
          <PasswordInput
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => { set('password')(e); if (errors.password) touch('password', e.target.value) }}
            onBlur={(e) => touch('password', e.target.value)}
            placeholder="Mínimo 8 caracteres con letras y números"
          />
          {errors.password
            ? <p className="err">{errors.password}</p>
            : <p className="hint">Mínimo 8 caracteres, al menos una letra y un número.</p>
          }
        </div>

        <div className="field">
          <label>Enlace a tu portafolio externo <span className="req">*</span></label>
          <input
            className={'input' + (errors.portfolio ? ' input-error' : '')}
            value={form.portfolio}
            onChange={(e) => { set('portfolio')(e); if (errors.portfolio) touch('portfolio', e.target.value) }}
            onBlur={(e) => touch('portfolio', e.target.value)}
            placeholder="https://behance.net/tuperfil"
          />
          {errors.portfolio
            ? <p className="err">{errors.portfolio}</p>
            : <p className="hint">Obligatorio. Behance, Canva, Drive, TikTok, etc. Lo revisamos manualmente.</p>
          }
        </div>

        <div className="info-banner">
          <strong>¿Qué sigue?</strong> Tu cuenta quedará <em>En validación</em>. Un admin revisa tu portafolio y, al aprobarte, capturas tu CLABE para recibir pagos.
        </div>

        {serverErr && <p className="err" style={{ marginBottom: 14 }}>{serverErr}</p>}

        <button className="btn btn-grad btn-block" type="submit" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar para validación'}
        </button>
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
