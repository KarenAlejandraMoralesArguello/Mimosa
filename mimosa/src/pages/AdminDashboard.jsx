import { useState } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import Modal from '../components/Modal.jsx'
import { PENDING_CREATORS, PENDING_CAMPAIGNS, ORDERS, STATUS_MAP } from '../data/mock.js'

const NAV = [
  { id: 'creators', label: 'Validar creadoras', icon: '✅', badge: PENDING_CREATORS.length },
  { id: 'campaigns', label: 'Pre-aprobar campañas', icon: '📣', badge: PENDING_CAMPAIGNS.length },
  { id: 'arbitration', label: 'Arbitraje', icon: '⚖️' },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('creators')
  return (
    <DashboardShell
      nav={NAV}
      active={tab}
      onNavigate={setTab}
      accent="var(--violeta)"
      title={{ creators: 'Validación de creadoras', campaigns: 'Pre-aprobación de campañas', arbitration: 'Panel de arbitraje' }[tab]}
      subtitle="Panel de administración · Mimosa Colab Club"
    >
      {tab === 'creators' && <Creators />}
      {tab === 'campaigns' && <CampaignReview />}
      {tab === 'arbitration' && <Arbitration />}
    </DashboardShell>
  )
}

function Creators() {
  const [list, setList] = useState(PENDING_CREATORS)
  const [reject, setReject] = useState(null)
  const resolve = (id) => setList(list.filter((c) => c.id !== id))

  if (list.length === 0) return <div className="card card-pad center"><p className="text-muted">✓ No hay creadoras pendientes de validación.</p></div>

  return (
    <>
      <div className="grid cards-grid">
        {list.map((c) => (
          <div key={c.id} className="card card-pad">
            <div className="applicant-head">
              <div className="dash-avatar lg">{c.name.charAt(0)}</div>
              <div><strong>{c.name}</strong><div className="text-muted">{c.handle}</div></div>
              <span className="badge badge-solar"><span className="dot" /> En validación</span>
            </div>
            <p className="text-muted" style={{ fontSize: 13 }}>Enviado: {c.submitted}</p>
            <a className="link-azul" href={c.portfolio} target="_blank" rel="noreferrer">🔗 Revisar portafolio externo</a>
            <div className="applicant-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setReject(c)}>Rechazar</button>
              <button className="btn btn-primary btn-sm" style={{ background: 'var(--verde)' }} onClick={() => resolve(c.id)}>Aprobar</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!reject} onClose={() => setReject(null)} title={reject ? `Feedback para ${reject.name}` : ''}
        footer={<button className="btn btn-primary btn-sm" onClick={() => { resolve(reject.id); setReject(null) }}>Enviar feedback y devolver a borrador</button>}>
        <p className="text-muted">El perfil vuelve a estado “Borrador” y la creadora recibe este feedback por correo.</p>
        <div className="field"><label>Feedback constructivo</label><textarea className="textarea" placeholder="Ej. El portafolio necesita más muestras de video vertical y mejor iluminación…" /></div>
      </Modal>
    </>
  )
}

function CampaignReview() {
  const [list, setList] = useState(PENDING_CAMPAIGNS)
  const resolve = (id) => setList(list.filter((c) => c.id !== id))
  if (list.length === 0) return <div className="card card-pad center"><p className="text-muted">✓ No hay campañas pendientes de pre-aprobación.</p></div>
  return (
    <div className="grid cards-grid">
      {list.map((c) => (
        <div key={c.id} className="card card-pad">
          <span className="badge badge-solar"><span className="dot" /> Pendiente por aceptar</span>
          <h3 style={{ marginTop: 12 }}>{c.title}</h3>
          <p className="text-muted">{c.brand} · enviada {c.submitted}</p>
          <div className="applicant-actions" style={{ marginTop: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => resolve(c.id)}>Rechazar</button>
            <button className="btn btn-primary btn-sm" style={{ background: 'var(--verde)' }} onClick={() => resolve(c.id)}>Publicar en el muro</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function Arbitration() {
  return (
    <div className="grid orders-grid">
      {ORDERS.map((o) => {
        const st = STATUS_MAP[o.status]
        return (
          <div key={o.id} className="card card-pad order-card">
            <span className={`badge ${st.badge}`}><span className="dot" /> {st.label}</span>
            <h3 style={{ marginTop: 12 }}>{o.campaign}</h3>
            <div className="order-meta">
              <span>🏢 {o.brand}</span>
              <span>👤 {o.creator}</span>
              <span>💰 ${o.base.toLocaleString()}</span>
            </div>
            {o.deliveryUrl
              ? <a className="link-azul" href={o.deliveryUrl} target="_blank" rel="noreferrer">🔗 Inspeccionar entrega</a>
              : <p className="hint">Sin entrega registrada aún.</p>}
            <div className="applicant-actions" style={{ marginTop: 14 }}>
              <button className="btn btn-ghost btn-sm">Ver historial de chat</button>
              <button className="btn btn-primary btn-sm">Resolver disputa</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
