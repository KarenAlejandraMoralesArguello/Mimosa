import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

// Acceso interno del equipo Mimosa. Esta ruta NO está enlazada en ninguna
// pantalla pública; solo se llega conociendo la URL /acceso-staff.
// El rol 'admin' se otorga manualmente desde la DB — nunca por registro público.
export default function StaffLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
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
      setErr('Credenciales inválidas.')
      setLoading(false)
      return
    }

    // Verificar que el perfil tenga rol 'admin' en la DB.
    const { data: perfil, error: perfilErr } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', data.session.user.id)
      .single()

    if (perfilErr || !perfil || perfil.rol !== 'admin') {
      setErr('Credenciales inválidas.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    await login(data.session)
    navigate('/admin')
  }

  return (
    <div className="staff-login">
      <form className="staff-card" onSubmit={submit}>
        <Logo light />
        <span className="badge badge-violeta" style={{ marginTop: 18 }}><span className="dot" /> Acceso interno</span>
        <h1>Panel de administración</h1>
        <p>Solo para el equipo de Mimosa Colab Club.</p>
        <div className="field">
          <label htmlFor="se">Correo del equipo</label>
          <input id="se" className="input" type="email" autoComplete="off"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="sp">Contraseña</label>
          <input id="sp" className="input" type="password" autoComplete="off"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && <p className="err" style={{ marginBottom: 14 }}>{err}</p>}
        <button className="btn btn-grad btn-block" type="submit" disabled={loading}>
          {loading ? 'Verificando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
