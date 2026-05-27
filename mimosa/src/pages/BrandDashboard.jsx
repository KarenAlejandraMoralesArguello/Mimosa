import { useState } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import Modal from '../components/Modal.jsx'
import { CAMPAIGNS, APPLICANTS, CHAT_MESSAGES, ORDERS, STATUS_MAP, quote, MIN_VIDEO_PRICE } from '../data/mock.js'

const NAV = [
  { id: 'campaigns', label: 'Campañas', icon: '📣' },
  { id: 'applicants', label: 'Postulantes', icon: '👥', badge: APPLICANTS.length },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'orders', label: 'Órdenes & Escrow', icon: '🛡️' },
]

export default function BrandDashboard() {
  const [tab, setTab] = useState('campaigns')

  return (
    <DashboardShell
      nav={NAV}
      active={tab}
      onNavigate={setTab}
      accent="var(--rosa)"
      title={{ campaigns: 'Mis campañas', applicants: 'Postulantes', chat: 'Chat de negociación', orders: 'Órdenes & Escrow' }[tab]}
      subtitle="Panel de marca · Lumière Skincare"
    >
      {tab === 'campaigns' && <Campaigns />}
      {tab === 'applicants' && <Applicants onOpenChat={() => setTab('chat')} />}
      {tab === 'chat' && <Chat />}
      {tab === 'orders' && <Orders />}
    </DashboardShell>
  )
}

function Campaigns() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="toolbar">
        <p className="text-muted">3 de 6 campañas activas usadas · plan <strong>Mimosa Starter</strong></p>
        <button className="btn btn-grad btn-sm" onClick={() => setOpen(true)}>+ Nueva campaña</button>
      </div>
      <div className="grid cards-grid">
        {CAMPAIGNS.map((c) => {
          const st = STATUS_MAP[c.status]
          const urgent = c.deadlineHours != null && c.deadlineHours < 24
          return (
            <div key={c.id} className="card card-pad camp-card">
              <div className="camp-top">
                <span className={`badge ${st.badge}`}><span className="dot" /> {st.label}</span>
                {urgent && <span className="badge badge-naranja"><span className="dot" /> {c.deadlineHours}h restantes</span>}
              </div>
              <h3>{c.title}</h3>
              <p className="text-muted">{c.brief}</p>
              <div className="camp-meta">
                <span>🎬 {c.videos} videos · {c.duration}s</span>
                <span>🎭 {c.style}</span>
                <span>💰 ${c.budget.toLocaleString()} MXN</span>
              </div>
              <div className="camp-foot">
                <span className="text-muted">{c.applicants} postulantes</span>
                <button className="btn btn-ghost btn-sm">Ver detalle</button>
              </div>
            </div>
          )
        })}
      </div>
      <NewCampaignModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function NewCampaignModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva campaña (briefing)"
      footer={<>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
        <button className="btn btn-grad btn-sm" onClick={onClose}>Enviar a pre-aprobación</button>
      </>}
    >
      <div className="field"><label>Título de la campaña</label><input className="input" placeholder="Ej. Unboxing serum facial" /></div>
      <div className="grid-2">
        <div className="field"><label>Duración por video (segundos)</label><input className="input" type="number" defaultValue={30} /></div>
        <div className="field"><label>Cantidad de videos</label><input className="input" type="number" defaultValue={3} /></div>
      </div>
      <div className="field">
        <label>Estilo narrativo</label>
        <select className="select" defaultValue="UGC"><option>UGC</option><option>Unboxing</option><option>Reseña</option><option>Acting</option></select>
      </div>
      <div className="field"><label>Requerimientos y especificaciones técnicas</label><textarea className="textarea" placeholder="Tono, iluminación, encuadre, menciones obligatorias…" /></div>
      <p className="hint">Tu campaña pasa por pre-aprobación de un admin antes de hacerse pública en el muro de creadoras.</p>
    </Modal>
  )
}

function Applicants({ onOpenChat }) {
  const [portfolio, setPortfolio] = useState(null)
  return (
    <>
      <p className="text-muted toolbar">Campaña: <strong>Unboxing serum facial — línea Glow</strong></p>
      <div className="grid cards-grid">
        {APPLICANTS.map((a) => {
          const q = quote(a.price * 3)
          return (
            <div key={a.id} className="card card-pad applicant-card">
              <div className="applicant-head">
                <div className="dash-avatar lg">{a.name.charAt(0)}</div>
                <div>
                  <strong>{a.name}</strong>
                  <div className="text-muted">{a.handle} · {a.rating} ★</div>
                </div>
                {a.verified
                  ? <span className="badge badge-verde"><span className="dot" /> Verificada</span>
                  : <span className="badge badge-solar"><span className="dot" /> Pendiente</span>}
              </div>
              <p className="applicant-proposal">“{a.proposal}”</p>
              <div className="applicant-price">
                <span>Propuesta: <strong>${a.price} MXN/video</strong></span>
                <span className="text-muted">Total marca ≈ ${q.brandPays.toLocaleString()}</span>
              </div>
              <div className="applicant-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setPortfolio(a)}>Ver portafolio</button>
                <button className="btn btn-primary btn-sm" onClick={onOpenChat}>Iniciar chat</button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={!!portfolio} onClose={() => setPortfolio(null)} title={portfolio ? `Portafolio · ${portfolio.name}` : ''}
        footer={<a className="btn btn-grad btn-sm" href={portfolio?.portfolio} target="_blank" rel="noreferrer">Abrir en nueva pestaña ↗</a>}>
        {portfolio && (
          <div className="portfolio-modal">
            <div className="portfolio-frame">
              <span>🎬</span>
              <p>Vista previa del portafolio externo</p>
              <code>{portfolio.portfolio}</code>
            </div>
            <p className="text-muted">El portafolio se abre en un modal para no perder tu flujo de revisión (PRD §6.3).</p>
          </div>
        )}
      </Modal>
    </>
  )
}

function Chat() {
  const [orderOpen, setOrderOpen] = useState(false)
  return (
    <div className="chat-layout">
      <div className="chat-main card">
        <div className="chat-head">
          <div className="dash-avatar">V</div>
          <div>
            <strong>Valentina Ríos</strong>
            <div className="text-muted" style={{ fontSize: 13 }}>@valeugc · Glow serum</div>
          </div>
          <span className="badge badge-verde" style={{ marginLeft: 'auto' }}><span className="dot" /> En línea</span>
        </div>
        <div className="chat-body">
          {CHAT_MESSAGES.map((m) => (
            <div key={m.id} className={`bubble ${m.from === 'brand' ? 'me' : 'them'}`}>
              {m.file && <span className="bubble-file">📎 {m.file} <em>(2.1 MB)</em></span>}
              <p>{m.text}</p>
              <span className="bubble-time">{m.time}</span>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <button className="chat-attach" title="Adjuntar referencia (máx 5MB)">📎</button>
          <input className="input" placeholder="Escribe un mensaje…" />
          <button className="btn btn-primary btn-sm">Enviar</button>
        </div>
        <p className="chat-note">Archivos de referencia hasta 5MB. Prohibido subir videos finales aquí.</p>
      </div>

      <aside className="chat-side card card-pad">
        <h3>Resumen de la colaboración</h3>
        <ul className="chat-summary">
          <li><span>Campaña</span><strong>Glow serum</strong></li>
          <li><span>Videos</span><strong>3 × 30s</strong></li>
          <li><span>Acuerdo verbal</span><strong>$1,500 MXN</strong></li>
        </ul>
        <button className="btn btn-grad btn-block" onClick={() => setOrderOpen(true)}>🛡️ Crear orden</button>
        <p className="hint">Al crear la orden, la creadora la acepta y se redirige a Stripe para el pago en escrow.</p>
      </aside>

      <CreateOrderModal open={orderOpen} onClose={() => setOrderOpen(false)} />
    </div>
  )
}

function CreateOrderModal({ open, onClose }) {
  const [base, setBase] = useState(1500)
  const [step, setStep] = useState('form') // form | checkout | done
  const q = quote(base || 0)
  const tooLow = base < MIN_VIDEO_PRICE

  const reset = () => { setStep('form'); onClose() }

  return (
    <Modal open={open} onClose={reset}
      title={step === 'form' ? 'Crear orden' : step === 'checkout' ? 'Checkout Stripe (escrow)' : 'Orden activa'}
      footer={
        step === 'form' ? (
          <button className="btn btn-grad btn-sm" disabled={tooLow} onClick={() => setStep('checkout')}>Continuar al pago</button>
        ) : step === 'checkout' ? (
          <button className="btn btn-grad btn-sm" onClick={() => setStep('done')}>Pagar ${q.brandPays.toLocaleString()} MXN</button>
        ) : (
          <button className="btn btn-grad btn-sm" onClick={reset}>Listo</button>
        )
      }>
      {step === 'form' && (
        <>
          <div className="grid-2">
            <div className="field"><label>Cantidad de videos</label><input className="input" type="number" defaultValue={3} /></div>
            <div className="field"><label>Fecha límite</label><input className="input" type="date" defaultValue="2026-06-04" /></div>
          </div>
          <div className="field">
            <label>Precio base totalizado (MXN)</label>
            <input className="input" type="number" value={base} onChange={(e) => setBase(Number(e.target.value))} />
            {tooLow && <p className="err">El acuerdo no puede ser menor a ${MIN_VIDEO_PRICE} MXN por video (PRD §5.2).</p>}
          </div>
          <QuoteBox q={q} />
        </>
      )}
      {step === 'checkout' && (
        <div className="checkout">
          <div className="stripe-badge">Pago seguro · <strong>Stripe</strong></div>
          <div className="field"><label>Número de tarjeta</label><input className="input" placeholder="4242 4242 4242 4242" /></div>
          <div className="grid-2">
            <div className="field"><label>Vence</label><input className="input" placeholder="MM/AA" /></div>
            <div className="field"><label>CVC</label><input className="input" placeholder="123" /></div>
          </div>
          <QuoteBox q={q} />
          <p className="hint">El capital se congela en garantía (escrow) y se libera al aprobar el contenido.</p>
        </div>
      )}
      {step === 'done' && (
        <div className="order-done">
          <div className="done-check">✓</div>
          <h3 style={{ color: 'var(--verde)' }}>Fondos en escrow</h3>
          <p className="text-muted">La orden pasó a <strong>“Colaboración en curso”</strong>. ${q.brandPays.toLocaleString()} MXN quedaron congelados de forma segura.</p>
        </div>
      )}
    </Modal>
  )
}

function QuoteBox({ q }) {
  return (
    <div className="quote-box">
      <div className="quote-row"><span>Costo base pactado</span><strong>${q.base.toLocaleString()}</strong></div>
      <div className="quote-row"><span>Comisión marca (+15%)</span><strong>+${(q.brandPays - q.base).toLocaleString()}</strong></div>
      <div className="quote-row total"><span>Pagas en checkout</span><strong>${q.brandPays.toLocaleString()} MXN</strong></div>
      <div className="quote-divider" />
      <div className="quote-row sub"><span>Creadora recibe (−5%)</span><strong>${q.creatorGets.toLocaleString()}</strong></div>
      <div className="quote-row sub"><span>Mimosa retiene (20%)</span><strong>${q.mimosa.toLocaleString()}</strong></div>
    </div>
  )
}

function Orders() {
  return (
    <div className="grid orders-grid">
      {ORDERS.map((o) => {
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
              <span>👤 {o.creator}</span>
              <span>🎬 {o.videos} videos</span>
              <span>📅 {o.deadline}</span>
            </div>
            <div className="quote-row total"><span>En escrow</span><strong>${q.brandPays.toLocaleString()} MXN</strong></div>
            {o.status === 'entregado' && (
              <div className="order-delivery">
                <a className="link-azul" href={o.deliveryUrl} target="_blank" rel="noreferrer">🔗 Ver entrega</a>
                <div className="order-actions">
                  <button className="btn btn-ghost btn-sm">Solicitar corrección</button>
                  <button className="btn btn-primary btn-sm">Aprobar y liberar</button>
                </div>
              </div>
            )}
            {o.status === 'en_curso' && <p className="hint">Esperando entrega de la creadora.</p>}
            {o.status === 'completado' && <p className="hint" style={{ color: 'var(--verde)' }}>✓ Fondos liberados a la creadora.</p>}
          </div>
        )
      })}
    </div>
  )
}
