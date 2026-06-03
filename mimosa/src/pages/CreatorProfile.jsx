import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Logo from '../components/Logo.jsx'
import Icon from '../components/Icon.jsx'
import WhatsAppButton from '../components/WhatsAppButton.jsx'

const STATUS_LABEL = {
  verificado:    { label: 'Verificada',    cls: 'badge-verde'   },
  en_validacion: { label: 'En revisión',   cls: 'badge-solar'   },
  borrador:      { label: 'En revisión',   cls: 'badge-solar'   },
  rechazado:     { label: 'En revisión',   cls: 'badge-solar'   },
}

export default function CreatorProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return }

    supabase
      .rpc('perfil_publico_creadora', { p_id: id })
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          setNotFound(true)
        } else {
          setProfile(data[0])
        }
        setLoading(false)
      })
  }, [id])

  return (
    <div className="creator-profile-page">
      <header className="cp-header">
        <Link to="/"><Logo /></Link>
        <div className="cp-header-actions">
          <Link to="/login" className="btn btn-ghost btn-sm">Iniciar sesión</Link>
          <Link to="/registro" className="btn btn-grad btn-sm">Crear cuenta</Link>
        </div>
      </header>

      <main className="cp-main container">
        {loading && (
          <div className="cp-state">
            <div className="cp-spinner" />
          </div>
        )}

        {!loading && notFound && (
          <div className="cp-state">
            <Icon name="user" size={48} color="var(--line)" />
            <h2>Perfil no encontrado</h2>
            <p className="text-muted">Este perfil no existe o no está disponible.</p>
            <Link to="/" className="btn btn-grad btn-sm" style={{ marginTop: 16 }}>
              Ir al inicio
            </Link>
          </div>
        )}

        {!loading && profile && (
          <div className="cp-card">
            {/* Avatar + nombre + badge */}
            <div className="cp-hero">
              <div className="dash-avatar xl" aria-hidden="true">
                {profile.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="cp-hero-info">
                <h1>{profile.nombre}</h1>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                  {(() => {
                    const s = STATUS_LABEL[profile.status] ?? STATUS_LABEL.en_validacion
                    return (
                      <span className={`badge ${s.cls}`}>
                        <span className="dot" /> {s.label}
                      </span>
                    )
                  })()}
                  <span className="badge badge-violeta">
                    <Icon name="palette" size={12} /> Creadora UGC
                  </span>
                </div>
              </div>
            </div>

            <div className="cp-divider" />

            {/* Stats */}
            <div className="cp-stats">
              <div className="cp-stat">
                <strong>{profile.ordenes_completadas}</strong>
                <span>Órdenes completadas</span>
              </div>
              {profile.calificacion != null && (
                <div className="cp-stat">
                  <strong>⭐ {profile.calificacion}</strong>
                  <span>Calificación</span>
                </div>
              )}
              <div className="cp-stat">
                <strong>
                  {new Date(profile.miembro_desde).toLocaleDateString('es-MX', {
                    month: 'long', year: 'numeric',
                  })}
                </strong>
                <span>Miembro desde</span>
              </div>
            </div>

            <div className="cp-divider" />

            {/* Portafolio */}
            <div className="cp-section">
              <h3>Portafolio</h3>
              {profile.portafolio_url ? (
                <a
                  href={profile.portafolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm cp-portfolio-link"
                >
                  <Icon name="external" size={14} />
                  Ver portafolio externo
                </a>
              ) : (
                <p className="text-muted" style={{ fontSize: 14 }}>Sin portafolio público.</p>
              )}
            </div>

            <div className="cp-divider" />

            {/* CTA para marcas */}
            <div className="cp-cta">
              <div>
                <h3>¿Quieres colaborar?</h3>
                <p className="text-muted">
                  Regístrate como marca para crear campañas y contactar a esta creadora.
                </p>
              </div>
              <Link to="/registro?rol=marca" className="btn btn-grad">
                Crear cuenta de marca
              </Link>
            </div>
          </div>
        )}
      </main>

      <WhatsAppButton />
    </div>
  )
}
