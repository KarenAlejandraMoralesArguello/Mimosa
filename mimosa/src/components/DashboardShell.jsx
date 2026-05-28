import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Logo from './Logo.jsx'
import Icon from './Icon.jsx'

export default function DashboardShell({ nav, active, onNavigate, title, subtitle, accent, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="dash">
      <aside className="dash-side" style={accent ? { '--accent': accent } : undefined}>
        <Link to="/" className="dash-logo"><Logo light /></Link>
        <nav className="dash-nav">
          {nav.map((item) => (
            <button
              key={item.id}
              className={`dash-nav-item${active === item.id ? ' is-active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="dash-nav-icon"><Icon name={item.icon} size={18} /></span>
              {item.label}
              {item.badge != null && <span className="dash-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <Link to="/cuenta" className="dash-user" title="Mi cuenta">
          <div className="dash-avatar">{(user?.name || 'U').charAt(0)}</div>
          <div className="dash-user-meta">
            <strong>{user?.name || 'Usuario'}</strong>
            <span>{user?.email}</span>
          </div>
          <Icon name="external" size={14} className="dash-user-ic" />
        </Link>
        <button className="dash-logout" onClick={() => { logout(); navigate('/') }}>Cerrar sesión</button>
      </aside>

      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h1>{title}</h1>
            {subtitle && <p className="text-muted">{subtitle}</p>}
          </div>
        </header>
        <div className="dash-content">{children}</div>
      </main>
    </div>
  )
}
