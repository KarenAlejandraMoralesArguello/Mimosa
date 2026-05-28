import { Link, useLocation } from 'react-router-dom'
import Logo from '../components/Logo.jsx'

export default function NotFound() {
  const location = useLocation()
  return (
    <div className="notfound">
      <div className="container notfound-inner">
        <Link to="/" className="notfound-brand"><Logo /></Link>
        <div className="notfound-num" aria-hidden="true">
          <span>4</span>
          <span className="notfound-zero" />
          <span>4</span>
        </div>
        <h1>Página no encontrada</h1>
        <p className="text-muted">
          La ruta <code>{location.pathname}</code> no existe o se movió.
          Probablemente seguiste un enlace antiguo.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="btn btn-grad">Ir al inicio</Link>
          <Link to="/login" className="btn btn-ghost">Iniciar sesión</Link>
        </div>
      </div>
    </div>
  )
}
