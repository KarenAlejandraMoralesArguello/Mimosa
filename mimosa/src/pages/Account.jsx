import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { PLANS } from '../data/mock.js'

// /cuenta — Mi Cuenta / Ajustes.
// Las secciones disponibles cambian según el rol del usuario.
export default function Account() {
  const { user, patchUser, logout } = useAuth()
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
          <ProfileSection user={user} patchUser={patchUser} />
          <SecuritySection user={user} />
          {user.role === 'brand'   && <PlanSection    user={user} patchUser={patchUser} />}
          {user.role === 'creator' && <CreatorSection user={user} patchUser={patchUser} />}
          <DangerSection onLogout={() => { logout(); navigate('/') }} />
        </div>
      </main>
    </div>
  )
}

function RoleBadge({ role }) {
  if (role === 'brand')   return <span className="badge badge-rosa"><span className="dot" /> Marca</span>
  if (role === 'creator') return <span className="badge badge-solar"><span className="dot" /> Creadora</span>
  return <span className="badge badge-violeta"><span className="dot" /> Equipo Mimosa</span>
}

/* ---------- Perfil ---------- */
function ProfileSection({ user, patchUser }) {
  const [name, setName] = useState(user.name)
  const [msg,  setMsg]  = useState('')
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  const dirty = name.trim() !== user.name

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !dirty) return
    setBusy(true); setErr(''); setMsg('')

    const { error } = await supabase
      .from('perfiles')
      .update({ nombre: name.trim() })
      .eq('id', user.id)

    setBusy(false)
    if (error) { setErr('No se pudo guardar. Intenta de nuevo.'); return }

    patchUser({ name: name.trim() })
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
      {err && <p className="err">{err}</p>}
      {msg && <p className="hint hint-ok"><Icon name="check" size={13} color="var(--verde)" strokeWidth={2.5} /> {msg}</p>}
      <button className="btn btn-grad btn-sm" type="submit" disabled={!dirty || busy}>
        {busy ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}

/* ---------- Seguridad ---------- */
function SecuritySection({ user }) {
  const [cur,  setCur]  = useState('')
  const [next, setNext] = useState('')
  const [next2,setNext2]= useState('')
  const [err,  setErr]  = useState('')
  const [msg,  setMsg]  = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    if (!cur)              { setErr('Ingresa tu contraseña actual.'); return }
    if (next.length < 8)   { setErr('La nueva contraseña debe tener al menos 8 caracteres.'); return }
    if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) { setErr('La contraseña debe combinar letras y números.'); return }
    if (next !== next2)    { setErr('Las contraseñas no coinciden.'); return }

    setBusy(true)

    // Verificar contraseña actual re-autenticando
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    user.email,
      password: cur,
    })
    if (signInError) {
      setBusy(false)
      setErr('La contraseña actual es incorrecta.')
      return
    }

    // Cambiar a la nueva contraseña
    const { error: updateError } = await supabase.auth.updateUser({ password: next })
    setBusy(false)
    if (updateError) { setErr('No se pudo cambiar la contraseña. Intenta de nuevo.'); return }

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
      <button className="btn btn-grad btn-sm" type="submit" disabled={busy}>
        {busy ? 'Verificando…' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}

/* ---------- Plan (solo marca) ---------- */
function PlanSection({ user, patchUser }) {
  const [plan, setPlan] = useState(user.plan || 'starter')
  const [msg,  setMsg]  = useState('')
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const dirty = plan !== (user.plan || 'starter')
  const current = PLANS.find((p) => p.id === plan)

  // Carga el plan real desde marcas al montar
  useEffect(() => {
    supabase
      .from('marcas')
      .select('plan')
      .eq('perfil_id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.plan) {
          setPlan(data.plan)
          if (!user.plan) patchUser({ plan: data.plan })
        }
        setLoaded(true)
      })
  }, [user.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setBusy(true); setErr(''); setMsg('')

    const { error } = await supabase
      .from('marcas')
      .update({ plan })
      .eq('perfil_id', user.id)

    setBusy(false)
    if (error) { setErr('No se pudo guardar el plan. Intenta de nuevo.'); return }

    patchUser({ plan })
    setMsg('Plan actualizado. El cobro prorrateado aparecerá en tu próxima factura.')
    setTimeout(() => setMsg(''), 3500)
  }

  if (!loaded) return (
    <div className="account-card" style={{ opacity: 0.5 }}>
      <div className="account-card-head"><h2>Plan de suscripción</h2></div>
    </div>
  )

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
      {err && <p className="err">{err}</p>}
      {msg && <p className="hint hint-ok"><Icon name="check" size={13} color="var(--verde)" strokeWidth={2.5} /> {msg}</p>}
      <button className="btn btn-grad btn-sm" disabled={!dirty || busy} onClick={save}>
        {busy ? 'Guardando…' : 'Cambiar plan'}
      </button>
    </div>
  )
}

/* ---------- Portafolio + CLABE (solo creadora) ---------- */
function CreatorSection({ user, patchUser }) {
  const [portfolio,   setPortfolio]   = useState(user.portfolio || '')
  const [clabe,       setClabe]       = useState('')
  const [clabeGuardada, setClabeGuardada] = useState(false) // ¿ya tiene CLABE?
  const [editClabe,   setEditClabe]   = useState(false)
  const [msg,   setMsg]   = useState('')
  const [err,   setErr]   = useState('')
  const [msgC,  setMsgC]  = useState('')
  const [errC,  setErrC]  = useState('')
  const [busy,  setBusy]  = useState(false)
  const [busyC, setBusyC] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase
      .from('creadoras')
      .select('portafolio_url, clabe_enc')
      .eq('perfil_id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.portafolio_url) {
          setPortfolio(data.portafolio_url)
          if (!user.portfolio) patchUser({ portfolio: data.portafolio_url })
        }
        setClabeGuardada(data?.clabe_enc != null)
        setLoaded(true)
      })
  }, [user.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const savePortfolio = async () => {
    setErr(''); setMsg('')
    if (portfolio && !/^https?:\/\/.+\..+/.test(portfolio.trim())) {
      setErr('URL de portafolio inválida.')
      return
    }
    setBusy(true)
    const { error } = await supabase
      .from('creadoras')
      .update({ portafolio_url: portfolio.trim() })
      .eq('perfil_id', user.id)
    setBusy(false)
    if (error) { setErr('No se pudo guardar. Intenta de nuevo.'); return }
    patchUser({ portfolio: portfolio.trim() })
    setMsg('Portafolio actualizado.')
    setTimeout(() => setMsg(''), 3000)
  }

  const saveClabe = async () => {
    setErrC(''); setMsgC('')
    if (!/^\d{18}$/.test(clabe)) { setErrC('La CLABE debe tener exactamente 18 dígitos.'); return }
    setBusyC(true)
    const { error } = await supabase.rpc('guardar_clabe', {
      p_perfil_id: user.id,
      p_clabe:     clabe,
    })
    setBusyC(false)
    if (error) { setErrC('No se pudo guardar la CLABE. Intenta de nuevo.'); return }
    setClabeGuardada(true)
    setEditClabe(false)
    setClabe('')
    setMsgC('CLABE guardada y encriptada correctamente.')
    setTimeout(() => setMsgC(''), 3500)
  }

  if (!loaded) return (
    <div className="account-card" style={{ opacity: 0.5 }}>
      <div className="account-card-head"><h2>Portafolio y cuenta bancaria</h2></div>
    </div>
  )

  return (
    <>
      {/* Portafolio */}
      <div className="account-card">
        <div className="account-card-head">
          <h2>Portafolio</h2>
          <p className="text-muted">Necesario para aplicar a campañas.</p>
        </div>
        <div className="field">
          <label>Enlace al portafolio</label>
          <input
            className="input"
            value={portfolio}
            onChange={(e) => setPortfolio(e.target.value)}
            placeholder="https://behance.net/tuperfil"
          />
        </div>
        {err && <p className="err">{err}</p>}
        {msg && <p className="hint hint-ok"><Icon name="check" size={13} color="var(--verde)" strokeWidth={2.5} /> {msg}</p>}
        <button className="btn btn-grad btn-sm" disabled={busy} onClick={savePortfolio}>
          {busy ? 'Guardando…' : 'Guardar portafolio'}
        </button>
      </div>

      {/* CLABE */}
      <div className="account-card">
        <div className="account-card-head">
          <h2>CLABE interbancaria</h2>
          <p className="text-muted">
            {clabeGuardada
              ? 'Tu CLABE está registrada y encriptada con pgsodium.'
              : 'Necesaria para recibir pagos por tus órdenes completadas.'}
          </p>
        </div>

        {clabeGuardada && !editClabe ? (
          <div className="field">
            <label>CLABE registrada</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input className="input" value="•••• •••• •••• •••• ••" disabled style={{ flex: 1 }} />
              <button className="btn btn-ghost btn-sm" onClick={() => setEditClabe(true)}>
                Actualizar
              </button>
            </div>
            <p className="hint">
              <Icon name="lock" size={12} color="var(--verde)" /> Encriptada con AES-256 — nunca se expone en texto plano.
            </p>
          </div>
        ) : (
          <div className="field">
            <label>CLABE (18 dígitos)</label>
            <input
              className="input"
              inputMode="numeric"
              maxLength={18}
              value={clabe}
              onChange={(e) => setClabe(e.target.value.replace(/\D/g, ''))}
              placeholder="012345678901234567"
              autoComplete="off"
            />
            <p className="hint">Se encripta con pgsodium antes de guardarse. Mimosa nunca la ve en texto plano.</p>
          </div>
        )}

        {errC && <p className="err">{errC}</p>}
        {msgC && <p className="hint hint-ok"><Icon name="check" size={13} color="var(--verde)" strokeWidth={2.5} /> {msgC}</p>}

        {(!clabeGuardada || editClabe) && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-grad btn-sm" disabled={busyC} onClick={saveClabe}>
              {busyC ? 'Guardando…' : 'Guardar CLABE'}
            </button>
            {editClabe && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditClabe(false); setClabe(''); setErrC('') }}>
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>
    </>
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
