import { useState } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import Modal from '../components/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { MARKETPLACE, ORDERS, STATUS_MAP, quote, MIN_VIDEO_PRICE } from '../data/mock.js'

const NAV = [
  { id: 'home', label: 'Inicio', icon: '🏠' },
  { id: 'market', label: 'Marketplace', icon: '🛒' },
  { id: 'orders', label: 'Mis órdenes', icon: '🎬' },
  { id: 'finance', label: 'Verificación CLABE', icon: '🏦' },
]

export default function CreatorDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('home')
  // Demo: una creadora recién registrada está "en_validacion"; las demo entran verificadas.
  const [status, setStatus] = useState(user?.status === 'en_validacion' ? 'en_validacion' : 'verificado')

  return (
    <DashboardShell
      nav={NAV}
      active={tab}
      onNavigate={setTab}
      accent="var(--solar)"
      title={{ home: 'Inicio', market: 'Marketplace de campañas', orders: 'Mis órdenes', finance: 'Verificación financiera' }[tab]}
      subtitle={`Panel de creadora · ${user?.name || 'Creadora'}`}
    >
      {tab === 'home' && <Home status={status} onVerify={() => setStatus('verificado')} goMarket={() => setTab('market')} />}
      {tab === 'market' && <Marketplace locked={status === 'en_validacion'} />}
      {tab === 'orders' && <Orders />}
      {tab === 'finance' && <Finance />}
    </DashboardShell>
  )
}

function Home({ status, onVerify, goMarket }) {
  if (status === 'en_validacion') {
    return (
      <div className="card card-pad validation-card">
        <span className="badge badge-solar"><span className="dot" /> En validación</span>
        <h2>Tu perfil está en revisión</h2>
        <p className="text-muted">
          Un administrador de Mimosa está auditando tu portafolio. Mientras tanto, tu acceso al
          marketplace está bloqueado. Te avisaremos por correo cuando haya respuesta.
        </p>
        <ol className="validation-steps">
          <li className="done">✓ Formulario y portafolio enviados</li>
          <li className="active">⏳ Auditoría humana del portafolio</li>
          <li>Verificación financiera (CLABE)</li>
          <li>Acceso total al marketplace</li>
        </ol>
        <p className="hint">Demo: simula la aprobación del administrador para continuar.</p>
        <button className="btn btn-grad" onClick={onVerify}>Simular aprobación del admin</button>
      </div>
    )
  }
  return (
    <>
      <div className="welcome-banner">
        <div>
          <span className="badge badge-verde"><span className="dot" /> Perfil verificado</span>
          <h2 style={{ color: '#fff', margin: '12px 0 6px' }}>¡Estás dentro del club!</h2>
          <p style={{ color: 'rgba(255,255,255,.9)', margin: 0 }}>Explora campañas y aplica con tu mejor propuesta.</p>
        </div>
        <button className="btn btn-light" onClick={goMarket}>Ver campañas →</button>
      </div>
      <div className="grid stats-grid">
        <Stat label="Órdenes activas" value="1" grad="var(--grad-rosa-violeta)" />
        <Stat label="Ingresos del mes" value="$1,710" grad="var(--grad-verde-azul)" />
        <Stat label="Postulaciones" value="3" grad="var(--grad-solar-rosa)" />
        <Stat label="Calificación" value="4.9 ★" grad="var(--grad-violeta-azul)" />
      </div>
    </>
  )
}

function Stat({ label, value, grad }) {
  return (
    <div className="stat-card" style={{ background: grad }}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function Marketplace({ locked }) {
  const [apply, setApply] = useState(null)
  if (locked) {
    return <div className="card card-pad center"><p className="text-muted">🔒 Tu perfil aún está en validación. No puedes aplicar a campañas todavía.</p></div>
  }
  return (
    <>
      <div className="grid cards-grid">
        {MARKETPLACE.map((c) => {
          const urgent = c.deadlineHours < 24
          return (
            <div key={c.id} className="market-card">
              <div className="market-banner" style={{ background: c.grad }}>
                <span className="badge badge-muted" style={{ background: 'rgba(255,255,255,.85)' }}>{c.style}</span>
                {urgent && <span className="badge badge-naranja" style={{ background: 'rgba(255,255,255,.9)' }}><span className="dot" /> {c.deadlineHours}h</span>}
              </div>
              <div className="card-pad">
                <h3>{c.title}</h3>
                <p className="text-muted" style={{ margin: '4px 0 12px' }}>{c.brand}</p>
                <div className="camp-meta">
                  <span>🎬 {c.videos} × {c.duration}s</span>
                  <span>💡 Ref. ${c.refBudget.toLocaleString()}</span>
                </div>
                <button className="btn btn-grad btn-block btn-sm" style={{ marginTop: 16 }} onClick={() => setApply(c)}>Aplicar</button>
              </div>
            </div>
          )
        })}
      </div>
      <ApplyModal campaign={apply} onClose={() => setApply(null)} />
    </>
  )
}

function ApplyModal({ campaign, onClose }) {
  const [price, setPrice] = useState(500)
  const tooLow = price < MIN_VIDEO_PRICE
  const q = quote((price || 0) * (campaign?.videos || 1))
  return (
    <Modal open={!!campaign} onClose={onClose} title={campaign ? `Aplicar · ${campaign.title}` : ''}
      footer={<button className="btn btn-grad btn-sm" disabled={tooLow} onClick={onClose}>Enviar postulación</button>}>
      {campaign && (
        <>
          <div className="field">
            <label>Tu propuesta creativa</label>
            <textarea className="textarea" placeholder="Describe tu idea conceptual para esta campaña…" />
          </div>
          <div className="field">
            <label>Tu costo por video (MXN)</label>
            <input className="input" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            {tooLow
              ? <p className="err">El mínimo es ${MIN_VIDEO_PRICE} MXN por video (PRD §5.2).</p>
              : <p className="hint">Por {campaign.videos} videos recibirías ≈ ${q.creatorGets.toLocaleString()} MXN netos (tras 5%).</p>}
          </div>
        </>
      )}
    </Modal>
  )
}

function Orders() {
  const [deliver, setDeliver] = useState(null)
  const mine = ORDERS
  return (
    <>
      <div className="grid orders-grid">
        {mine.map((o) => {
          const st = STATUS_MAP[o.status]
          const q = quote(o.base)
          const urgent = o.deadlineHours > 0 && o.deadlineHours < 24
          return (
            <div key={o.id} className="card card-pad order-card">
              <div className="order-head">
                <span className={`badge ${st.badge}`}><span className="dot" /> {st.label}</span>
                {urgent && <span className="badge badge-naranja"><span className="dot" /> {o.deadlineHours}h</span>}
              </div>
              <h3>{o.campaign}</h3>
              <div className="order-meta">
                <span>🏢 {o.brand}</span>
                <span>🎬 {o.videos} videos</span>
                <span>📅 {o.deadline}</span>
              </div>
              <div className="quote-row total"><span>Recibirás (neto)</span><strong style={{ color: 'var(--verde)' }}>${q.creatorGets.toLocaleString()} MXN</strong></div>
              {o.status === 'en_curso' && <button className="btn btn-grad btn-block btn-sm" onClick={() => setDeliver(o)}>📤 Entregar contenido</button>}
              {o.status === 'entregado' && <p className="hint">Entregado. Esperando revisión de la marca.</p>}
              {o.status === 'completado' && <p className="hint" style={{ color: 'var(--verde)' }}>✓ Pago liberado a tu CLABE.</p>}
            </div>
          )
        })}
      </div>
      <DeliverModal order={deliver} onClose={() => setDeliver(null)} />
    </>
  )
}

function DeliverModal({ order, onClose }) {
  const [url, setUrl] = useState('')
  const valid = /^https?:\/\/.+\..+/.test(url.trim())
  return (
    <Modal open={!!order} onClose={onClose} title="Entregar contenido"
      footer={<button className="btn btn-grad btn-sm" disabled={!valid} onClick={onClose}>Confirmar entrega</button>}>
      <div className="info-banner">
        Sube tus videos terminados a Google Drive, WeTransfer o Dropbox en alta definición.
        Activa permisos de lectura públicos y pega el enlace de descarga aquí.
      </div>
      <div className="field">
        <label>Enlace de descarga externo</label>
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/…" />
        {!valid && url && <p className="err">Ingresa una URL válida.</p>}
      </div>
      <p className="hint">No se permiten videos finales en el chat. La entrega se registra como “Entregado - Pendiente de Revisión”.</p>
    </Modal>
  )
}

function Finance() {
  const [clabe, setClabe] = useState('')
  const [saved, setSaved] = useState(false)
  const valid = /^\d{18}$/.test(clabe)
  return (
    <div className="card card-pad" style={{ maxWidth: 560 }}>
      <span className="badge badge-azul"><span className="dot" /> Verificación financiera</span>
      <h2 style={{ marginTop: 14 }}>Vincula tu cuenta para recibir pagos</h2>
      <p className="text-muted">Captura tu CLABE de 18 dígitos. Queda encriptada y vinculada a Stripe Connect para dispersión automática.</p>
      {saved ? (
        <div className="order-done"><div className="done-check">✓</div><h3 style={{ color: 'var(--verde)' }}>CLABE verificada</h3><p className="text-muted">Lista para recibir tus fondos netos.</p></div>
      ) : (
        <>
          <div className="field" style={{ marginTop: 16 }}>
            <label>CLABE (18 dígitos)</label>
            <input className="input" inputMode="numeric" maxLength={18} value={clabe}
              onChange={(e) => setClabe(e.target.value.replace(/\D/g, ''))} placeholder="012345678901234567" />
            {clabe && !valid && <p className="err">La CLABE debe tener exactamente 18 dígitos.</p>}
          </div>
          <button className="btn btn-grad" disabled={!valid} onClick={() => setSaved(true)}>🔒 Guardar y encriptar</button>
        </>
      )}
    </div>
  )
}
