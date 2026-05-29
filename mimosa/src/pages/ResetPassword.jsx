import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Logo from '../components/Logo.jsx'
import Icon from '../components/Icon.jsx'

// Supabase redirige aquí con un token en el hash de la URL (#access_token=...).
// onAuthStateChange detecta el evento PASSWORD_RECOVERY y establece la sesión
// temporal que permite llamar a updateUser({ password }).
//
// Validaciones (cliente + backend):
// - Mínimo 8 caracteres
// - Al menos 1 letra y 1 número
// - Coincidencia entre los dos campos
export default function ResetPassword() {
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false) // sesión de recovery recibida
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase dispara PASSWORD_RECOVERY cuando detecta el token en el hash.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setErr('')

    if (pwd.length < 8) { setErr('La contraseña debe tener al menos 8 caracteres.'); return }
    if (!/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) { setErr('La contraseña debe combinar letras y números.'); return }
    if (pwd !== pwd2) { setErr('Las contraseñas no coinciden.'); return }

    const { error } = await supabase.auth.updateUser({ password: pwd })

    if (error) {
      setErr('No pudimos actualizar tu contraseña. El enlace puede haber expirado.')
      return
    }

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

  if (!ready) {
    return (
      <div className="auth single">
        <div className="auth-form-wrap full">
          <div className="auth-form">
            <Link to="/" className="auth-back"><Logo /></Link>
            <h1>Verificando enlace…</h1>
            <p className="text-muted">Espera un momento mientras validamos tu solicitud.</p>
            <p className="hint" style={{ marginTop: 18 }}>
              Si el enlace expiró, <Link to="/recuperar">solicita uno nuevo aquí</Link>.
            </p>
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
