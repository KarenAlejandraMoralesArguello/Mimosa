import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'
import { findByEmail } from '../data/accounts.js'

// Acceso interno del equipo Mimosa. Esta ruta NO está enlazada en ninguna
// pantalla pública; solo se llega conociendo la URL.
// En producción, además, el rol 'admin' se valida del lado del servidor (RLS)
// y se otorga manualmente desde la base de datos.
export default function StaffLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    setErr('')
    const acc = findByEmail(email)
    if (!acc || acc.role !== 'admin' || !password) {
      setErr('Credenciales inválidas.')
      return
    }
    login(acc)
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
          <input id="se" className="input" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="sp">Contraseña</label>
          <input id="sp" className="input" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && <p className="err" style={{ marginBottom: 14 }}>{err}</p>}
        <button className="btn btn-grad btn-block" type="submit">Ingresar</button>
        <p className="staff-demo">Demo: admin@demo.com</p>
      </form>
    </div>
  )
}
