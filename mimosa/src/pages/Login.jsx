import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from '../components/Logo.jsx'

const DEMO = [
  { role: 'brand', name: 'Lumière Skincare', email: 'marca@demo.com', label: 'Entrar como Marca', grad: 'var(--grad-rosa-violeta)' },
  { role: 'creator', name: 'Valentina Ríos', email: 'creadora@demo.com', label: 'Entrar como Creadora', grad: 'var(--grad-solar-rosa)' },
  { role: 'admin', name: 'Equipo Mimosa', email: 'admin@demo.com', label: 'Entrar como Admin', grad: 'var(--grad-violeta-azul)' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const go = (u) => {
    login(u)
    navigate(u.role === 'brand' ? '/marca' : u.role === 'creator' ? '/creadora' : '/admin')
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
        <div className="auth-form">
          <h1>Iniciar sesión</h1>
          <p className="text-muted">Demo navegable — elige un rol para entrar al instante.</p>

          <div className="field">
            <label>Correo electrónico</label>
            <input className="input" type="email" placeholder="tucorreo@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input className="input" type="password" placeholder="••••••••" />
          </div>

          <p className="text-muted center" style={{ margin: '18px 0 12px', fontSize: 13 }}>Acceso rápido a la demo</p>
          <div className="demo-roles">
            {DEMO.map((d) => (
              <button key={d.role} className="demo-role" style={{ '--g': d.grad }} onClick={() => go(d)}>
                {d.label}
              </button>
            ))}
          </div>

          <p className="auth-alt">¿No tienes cuenta? <Link to="/registro">Crear cuenta</Link></p>
        </div>
      </div>
    </div>
  )
}
