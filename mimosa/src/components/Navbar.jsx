import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from './Logo.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const dash = user?.role === 'brand' ? '/marca'
    : user?.role === 'creator' ? '/creadora'
    : user?.role === 'admin' ? '/admin' : '/'

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo"><Logo /></Link>
        <nav className="nav-links">
          <a href="/#como-funciona">Cómo funciona</a>
          <a href="/#planes">Planes</a>
          <a href="/#para-creadoras">Para creadoras</a>
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <Link to={dash} className="btn btn-ghost btn-sm">Mi panel</Link>
              <button className="btn btn-primary btn-sm" onClick={() => { logout(); navigate('/') }}>Salir</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Iniciar sesión</Link>
              <Link to="/registro" className="btn btn-grad btn-sm">Crear cuenta</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
