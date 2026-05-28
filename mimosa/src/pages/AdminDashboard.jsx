import { useState } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import Modal from '../components/Modal.jsx'
import Icon from '../components/Icon.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { listAll, banAccount, unbanAccount } from '../data/accounts.js'
import { PENDING_CREATORS, PENDING_CAMPAIGNS, STATUS_MAP } from '../data/mock.js'

const NAV = [
  { id: 'creators', label: 'Validar creadoras', icon: 'check', badge: PENDING_CREATORS.length },
  { id: 'campaigns', label: 'Pre-aprobar campañas', icon: 'megaphone', badge: PENDING_CAMPAIGNS.length },
  { id: 'arbitration', label: 'Arbitraje', icon: 'scale' },
  { id: 'accounts', label: 'Cuentas', icon: 'users' },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('creators')
  return (
    <DashboardShell
      nav={NAV}
      active={tab}
      onNavigate={setTab}
      accent="var(--violeta)"
      title={{ creators: 'Validación de creadoras', campaigns: 'Pre-aprobación de campañas', arbitration: 'Panel de arbitraje', accounts: 'Cuentas registradas' }[tab]}
      subtitle="Panel de administración · Mimosa Colab Club"
    >
      {tab === 'creators' && <Creators />}
      {tab === 'campaigns' && <CampaignReview />}
      {tab === 'arbitration' && <Arbitration />}
      {tab === 'accounts' && <Accounts />}
    </DashboardShell>
  )
}

function Creators() {
  const [list, setList] = useState(PENDING_CREATORS)
  const [reject, setReject] = useState(null)
  const resolve = (id) => setList(list.filter((c) => c.id !== id))

  if (list.length === 0) return <div className="card card-pad center inline-ic"><Icon name="check" size={16} color="var(--verde)" strokeWidth={2.5} /> <p className="text-muted" style={{margin:0}}>No hay creadoras pendientes de validación.</p></div>

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
            <a className="link-azul" href={c.portfolio} target="_blank" rel="noreferrer"><Icon name="external" size={14} /> Revisar portafolio externo</a>
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
  if (list.length === 0) return <div className="card card-pad center inline-ic"><Icon name="check" size={16} color="var(--verde)" strokeWidth={2.5} /> <p className="text-muted" style={{margin:0}}>No hay campañas pendientes de pre-aprobación.</p></div>
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
  const { orders } = useStore()
  return (
    <div className="grid orders-grid">
      {orders.map((o) => {
        const st = STATUS_MAP[o.status]
        return (
          <div key={o.id} className="card card-pad order-card">
            <span className={`badge ${st.badge}`}><span className="dot" /> {st.label}</span>
            <h3 style={{ marginTop: 12 }}>{o.campaign}</h3>
            <div className="order-meta">
              <span><Icon name="building" size={14} /> {o.brand}</span>
              <span><Icon name="user" size={14} /> {o.creator}</span>
              <span><Icon name="money" size={14} /> ${o.base.toLocaleString()}</span>
            </div>
            {o.deliveryUrl
              ? <a className="link-azul" href={o.deliveryUrl} target="_blank" rel="noreferrer"><Icon name="external" size={14} /> Inspeccionar entrega</a>
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

/* ---------- CUENTAS (baneo, PRD §7.2) ---------- */
function Accounts() {
  const [accounts, setAccounts] = useState(() => listAll().filter((a) => a.role !== 'admin'))
  const [filter, setFilter] = useState('all') // all | brand | creator | banned
  const [search, setSearch] = useState('')
  const [banTarget, setBanTarget] = useState(null)

  const refresh = () => setAccounts(listAll().filter((a) => a.role !== 'admin'))

  const q = search.trim().toLowerCase()
  const list = accounts.filter((a) => {
    if (filter === 'brand' && a.role !== 'brand') return false
    if (filter === 'creator' && a.role !== 'creator') return false
    if (filter === 'banned' && !a.banned) return false
    if (q && !`${a.name} ${a.email}`.toLowerCase().includes(q)) return false
    return true
  })

  const onBan = (reason) => {
    banAccount(banTarget.email, reason)
    setBanTarget(null)
    refresh()
  }
  const onUnban = (acc) => {
    unbanAccount(acc.email)
    refresh()
  }

  return (
    <>
      <div className="market-toolbar">
        <div className="market-search">
          <Icon name="users" size={16} />
          <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o correo…" />
        </div>
        <div className="market-filters">
          <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todas</option>
            <option value="brand">Marcas</option>
            <option value="creator">Creadoras</option>
            <option value="banned">Suspendidas</option>
          </select>
        </div>
      </div>

      <p className="text-muted market-count">{list.length} cuenta{list.length !== 1 && 's'}</p>

      {list.length === 0 ? (
        <div className="card card-pad center"><p className="text-muted">Sin cuentas que coincidan con los filtros.</p></div>
      ) : (
        <div className="accounts-list">
          {list.map((a) => (
            <div key={a.email} className={`account-row${a.banned ? ' is-banned' : ''}`}>
              <div className="dash-avatar">{(a.name || '?').charAt(0)}</div>
              <div className="account-row-main">
                <strong>{a.name}</strong>
                <span className="text-muted">{a.email}</span>
              </div>
              <div className="account-row-meta">
                {a.role === 'brand' && <span className="badge badge-rosa"><span className="dot" /> Marca</span>}
                {a.role === 'creator' && <span className="badge badge-solar"><span className="dot" /> Creadora</span>}
                {a.banned && <span className="badge badge-muted" style={{ color: 'var(--naranja)' }}><span className="dot" /> Suspendida</span>}
              </div>
              <div className="account-row-actions">
                {a.banned
                  ? <button className="btn btn-ghost btn-sm" onClick={() => onUnban(a)}>Reactivar</button>
                  : <button className="btn btn-ghost btn-sm btn-warn" onClick={() => setBanTarget(a)}>Suspender</button>
                }
              </div>
            </div>
          ))}
        </div>
      )}

      <BanModal target={banTarget} onClose={() => setBanTarget(null)} onConfirm={onBan} />
    </>
  )
}

function BanModal({ target, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  if (!target) return null
  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={`Suspender cuenta · ${target.name}`}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-grad btn-warn btn-sm" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>Suspender cuenta</button>
        </>
      }
    >
      <div className="info-banner">
        <strong>PRD §7.2:</strong> al suspender, la cuenta no podrá iniciar sesión. La acción es reversible desde este mismo panel.
      </div>
      <div className="field">
        <label>Motivo de la suspensión</label>
        <textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. intento de desviar transacción fuera de Stripe, lenguaje ofensivo en chat, entregables vacíos reiterados…" />
      </div>
    </Modal>
  )
}
