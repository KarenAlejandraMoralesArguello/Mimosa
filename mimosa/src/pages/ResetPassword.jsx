import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import Icon from '../components/Icon.jsx'

// Pantalla a la que llega el usuario desde el enlace del correo.
// En producción la URL llega con un token: /restablecer?token=...
// Supabase intercambia el token por una sesión temporal y permite llamar a
// supabase.auth.updateUser({ password: nueva }).
//
// Validaciones en cliente (mismo set que enforza el backend):
// - Mínimo 8 caracteres
// - Al menos 1 letra y 1 número
// - Coincidencia entre los dos campos
export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  // Si llegan a /restablecer sin token, en producción Supabase no permitirá
  // la actualización. En la demo aceptamos el modo "sin token" para poder probarlo.
  const noToken = !token

  const submit = (e) => {
    e.preventDefault()
    setErr('')
    if (pwd.length < 8) { setErr('La contraseña debe tener al menos 8 caracteres.'); return }
    if (!/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) { setErr('La contraseña debe combinar letras y números.'); return }
    if (pwd !== pwd2) { setErr('Las contraseñas no coinciden.'); return }
    // En producción: await supabase.auth.updateUser({ password: pwd })
    setDone(true)
    setTimeout(() => navigate('/login'), 1800)
  }

  if (done) {
    return (
      <div className="auth single">
        <div className="auth-form-wrap full">
          <div className="auth-form">
            <div className="reset-success">
              <div className="done-check"><Icon name="check" size={28} color="var(--verde)" strokeWidth={3} /></div>
              <h1>Contraseña actualizada</h1>
              <p className="text-muted">Listo. Ya puedes iniciar sesión con tu nueva contraseña.</p>
              <p className="hint">Redirigiendo al inicio de sesión…</p>
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
          <h1>Crea tu nueva contraseña</h1>
          <p className="text-muted">Elige una contraseña segura que recuerdes.</p>

          {noToken && (
            <div className="info-banner" style={{ marginTop: 14 }}>
              <strong>Modo demo:</strong> normalmente llegas aquí desde el enlace de tu correo.
              Para probar puedes definir una contraseña aunque no haya token.
            </div>
          )}

          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="np">Nueva contraseña</label>
            <input id="np" className="input" type="password" autoComplete="new-password"
              value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Mínimo 8 caracteres con letras y números" />
          </div>
          <div className="field">
            <label htmlFor="np2">Confirmar contraseña</label>
            <input id="np2" className="input" type="password" autoComplete="new-password"
              value={pwd2} onChange={(e) => setPwd2(e.target.value)} placeholder="Repite la contraseña" />
          </div>

          {err && <p className="err" style={{ marginBottom: 14 }}>{err}</p>}

          <button className="btn btn-grad btn-block" type="submit">Guardar nueva contraseña</button>

          <p className="auth-alt">
            <Link to="/login">Volver a iniciar sesión</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
