import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { updateAccount, changePassword } from '../data/accounts.js'
import { PLANS } from '../data/mock.js'

// /cuenta — Mi Cuenta / Ajustes.
// Las secciones disponibles cambian según el rol del usuario.
export default function Account() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const homePath = user?.role === 'brand' ? '/marca' : user?.role === 'creator' ? '/creadora' : '/admin'

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="account">
      <header className="account-header">
        <Link to={homePath} className="account-back" aria-label="Volver al panel">
          <Icon name="external" size={16} /> Volver al panel
        </Link>
        <Link to="/"><Logo /></Link>
      </header>

      <main className="container account-main">
        <div className="account-hero">
          <div className="dash-avatar lg" aria-hidden="true">{(user.name || '?').charAt(0)}</div>
          <div>
            <h1>{user.name}</h1>
            <p className="text-muted">{user.email} · <RoleBadge role={user.role} /></p>
          </div>
        </div>

        <div className="account-grid">
          <ProfileSection user={user} onUpdate={(updated) => login(updated)} />
          <SecuritySection user={user} />
          {user.role === 'brand' && <PlanSection user={user} onUpdate={(updated) => login(updated)} />}
          {user.role === 'creator' && <CreatorBankSection user={user} onUpdate={(updated) => login(updated)} />}
          <DangerSection onLogout={() => { logout(); navigate('/') }} />
        </div>
      </main>
    </div>
  )
}

function RoleBadge({ role }) {
  if (role === 'brand') return <span className="badge badge-rosa"><span className="dot" /> Marca</span>
  if (role === 'creator') return <span className="badge badge-solar"><span className="dot" /> Creadora</span>
  return <span className="badge badge-violeta"><span className="dot" /> Equipo Mimosa</span>
}

/* ---------- Perfil ---------- */
function ProfileSection({ user, onUpdate }) {
  const [name, setName] = useState(user.name)
  const [msg, setMsg] = useState('')
  const dirty = name.trim() !== user.name

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const updated = updateAccount(user.email, { name: name.trim() })
    onUpdate(updated)
    setMsg('Perfil actualizado.')
    setTimeout(() => setMsg(''), 2000)
  }

  return (
    <form className="account-card" onSubmit={submit}>
      <div className="account-card-head">
        <h2>Perfil</h2>
        <p className="text-muted">Tus datos básicos en la plataforma.</p>
      </div>
      <div className="field">
        <label>{user.role === 'brand' ? 'Nombre comercial' : 'Nombre o nombre artístico'}</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>Correo electrónico</label>
        <input className="input" value={user.email} disabled />
        <p className="hint">Para cambiar tu correo, contáctanos por WhatsApp.</p>
      </div>
      {msg && <p className="hint hint-ok"><Icon name="check" size={13} color="var(--verde)" strokeWidth={2.5} /> {msg}</p>}
      <button className="btn btn-grad btn-sm" type="submit" disabled={!dirty}>Guardar cambios</button>
    </form>
  )
}

/* ---------- Seguridad ---------- */
function SecuritySection({ user }) {
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [next2, setNext2] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const submit = (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    if (!cur) { setErr('Ingresa tu contraseña actual.'); return }
    if (next.length < 8) { setErr('La nueva contraseña debe tener al menos 8 caracteres.'); return }
    if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) { setErr('La contraseña debe combinar letras y números.'); return }
    if (next !== next2) { setErr('Las contraseñas no coinciden.'); return }
    changePassword(user.email, cur, next)
    setMsg('Contraseña actualizada.')
    setCur(''); setNext(''); setNext2('')
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <form className="account-card" onSubmit={submit}>
      <div className="account-card-head">
        <h2>Seguridad</h2>
        <p className="text-muted">Cambia tu contraseña. Se aplica al instante.</p>
      </div>
      <div className="field">
        <label>Contraseña actual</label>
        <input className="input" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} />
      </div>
      <div className="field">
        <label>Nueva contraseña</label>
        <input className="input" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Mínimo 8 caracteres con letras y números" />
      </div>
      <div className="field">
        <label>Repite la nueva contraseña</label>
        <input className="input" type="password" autoComplete="new-password" value={next2} onChange={(e) => setNext2(e.target.value)} />
      </div>
      {err && <p className="err">{err}</p>}
      {msg && <p className="hint hint-ok"><Icon name="check" size={13} color="var(--verde)" strokeWidth={2.5} /> {msg}</p>}
      <button className="btn btn-grad btn-sm" type="submit">Cambiar contraseña</button>
    </form>
  )
}

/* ---------- Plan (solo marca) ---------- */
function PlanSection({ user, onUpdate }) {
  const [plan, setPlan] = useState(user.plan || 'starter')
  const [msg, setMsg] = useState('')
  const dirty = plan !== (user.plan || 'starter')
  const current = PLANS.find((p) => p.id === plan)

  const save = () => {
    const updated = updateAccount(user.email, { plan })
    onUpdate(updated)
    setMsg('Plan actualizado. El cobro prorrateado aparecerá en tu próxima factura.')
    setTimeout(() => setMsg(''), 3500)
  }

  return (
    <div className="account-card">
      <div className="account-card-head">
        <h2>Plan de suscripción</h2>
        <p className="text-muted">
          Plan actual: <strong>{current?.name}</strong> · ${current?.price} MXN/mes · {current?.limit}
        </p>
      </div>
      <div className="plan-pick" style={{ marginBottom: 16 }}>
        {PLANS.map((p) => (
          <label key={p.id} className={`plan-pick-opt${plan === p.id ? ' is-on' : ''}`}>
            <input type="radio" name="plan-cuenta" checked={plan === p.id} onChange={() => setPlan(p.id)} />
            <span className="ppo-name">{p.name}</span>
            <span className="ppo-price">${p.price} MXN/mes</span>
            <span className="ppo-limit">{p.limit}</span>
          </label>
        ))}
      </div>
      {msg && <p className="hint hint-ok"><Icon name="check" size={13} color="var(--verde)" strokeWidth={2.5} /> {msg}</p>}
      <button className="btn btn-grad btn-sm" disabled={!dirty} onClick={save}>Cambiar plan</button>
    </div>
  )
}

/* ---------- Portafolio + CLABE (solo creadora) ---------- */
function CreatorBankSection({ user, onUpdate }) {
  const [portfolio, setPortfolio] = useState(user.portfolio || '')
  const [clabe, setClabe] = useState(user.clabe || '')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const save = () => {
    setErr(''); setMsg('')
    if (portfolio && !/^https?:\/\/.+\..+/.test(portfolio.trim())) { setErr('Portafolio: URL inválida.'); return }
    if (clabe && !/^\d{18}$/.test(clabe)) { setErr('La CLABE debe tener 18 dígitos.'); return }
    const updated = updateAccount(user.email, { portfolio: portfolio.trim(), clabe })
    onUpdate(updated)
    setMsg('Datos guardados. La CLABE queda encriptada y vinculada a Stripe Connect.')
    setTimeout(() => setMsg(''), 3500)
  }

  return (
    <div className="account-card">
      <div className="account-card-head">
        <h2>Portafolio y cuenta bancaria</h2>
        <p className="text-muted">Necesarios para aplicar a campañas y recibir pagos.</p>
      </div>
      <div className="field">
        <label>Enlace al portafolio</label>
        <input className="input" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://behance.net/tuperfil" />
      </div>
      <div className="field">
        <label>CLABE (18 dígitos)</label>
        <input className="input" inputMode="numeric" maxLength={18} value={clabe}
          onChange={(e) => setClabe(e.target.value.replace(/\D/g, ''))} placeholder="012345678901234567" />
        <p className="hint">Se almacena encriptada y vinculada a Stripe Connect para dispersión automática.</p>
      </div>
      {err && <p className="err">{err}</p>}
      {msg && <p className="hint hint-ok"><Icon name="check" size={13} color="var(--verde)" strokeWidth={2.5} /> {msg}</p>}
      <button className="btn btn-grad btn-sm" onClick={save}>Guardar</button>
    </div>
  )
}

/* ---------- Zona peligrosa ---------- */
function DangerSection({ onLogout }) {
  return (
    <div className="account-card danger">
      <div className="account-card-head">
        <h2>Sesión</h2>
        <p className="text-muted">Cierra sesión en este dispositivo.</p>
      </div>
      <button className="btn btn-ghost btn-warn btn-sm" onClick={onLogout}>Cerrar sesión</button>
    </div>
  )
}
