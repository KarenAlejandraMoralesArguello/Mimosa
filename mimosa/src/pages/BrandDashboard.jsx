import { useState } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import Modal from '../components/Modal.jsx'
import Icon from '../components/Icon.jsx'
import { useStore } from '../context/StoreContext.jsx'
import UrgentBanner from '../components/UrgentBanner.jsx'
import { CAMPAIGNS, APPLICANTS, CHAT_MESSAGES, STATUS_MAP, quote, MIN_VIDEO_PRICE } from '../data/mock.js'

const NAV = [
  { id: 'campaigns', label: 'Campañas', icon: 'megaphone' },
  { id: 'applicants', label: 'Postulantes', icon: 'users', badge: APPLICANTS.length },
  { id: 'chat', label: 'Chat', icon: 'chat' },
  { id: 'orders', label: 'Órdenes & Escrow', icon: 'shield' },
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
      {tab !== 'chat' && <UrgentBanner role="brand" onJumpToOrders={() => setTab('orders')} />}
      {tab === 'campaigns' && <Campaigns onOpenApplicants={() => setTab('applicants')} />}
      {tab === 'applicants' && <Applicants onOpenChat={() => setTab('chat')} />}
      {tab === 'chat' && <Chat onCreated={() => setTab('orders')} />}
      {tab === 'orders' && <Orders />}
    </DashboardShell>
  )
}

/* ------------------- CAMPAIGNS ------------------- */

function Campaigns({ onOpenApplicants }) {
  const [newOpen, setNewOpen] = useState(false)
  const [detail, setDetail] = useState(null)

  return (
    <>
      <div className="toolbar">
        <p className="text-muted">3 de 6 campañas activas usadas · plan <strong>Mimosa Starter</strong></p>
        <button className="btn btn-grad btn-sm" onClick={() => setNewOpen(true)}><Icon name="plus" size={14} color="#fff" /> Nueva campaña</button>
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
                <span><Icon name="video" size={14} /> {c.videos} videos · {c.duration}s</span>
                <span><Icon name="palette" size={14} /> {c.style}</span>
                <span><Icon name="money" size={14} /> ${c.budget.toLocaleString()} MXN</span>
              </div>
              <div className="camp-foot">
                <span className="text-muted">{c.applicants} postulantes</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setDetail(c)}>Ver detalle</button>
              </div>
            </div>
          )
        })}
      </div>
      <NewCampaignModal open={newOpen} onClose={() => setNewOpen(false)} />
      <CampaignDetailModal campaign={detail} onClose={() => setDetail(null)} onOpenApplicants={() => { setDetail(null); onOpenApplicants() }} />
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

function CampaignDetailModal({ campaign, onClose, onOpenApplicants }) {
  if (!campaign) return null
  const st = STATUS_MAP[campaign.status]
  const urgent = campaign.deadlineHours != null && campaign.deadlineHours < 24

  return (
    <Modal
      open={!!campaign}
      onClose={onClose}
      title={`Detalle · ${campaign.title}`}
      footer={<>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cerrar</button>
        <button className="btn btn-grad btn-sm" onClick={onOpenApplicants} disabled={campaign.applicants === 0}>
          Ver {campaign.applicants} postulantes
        </button>
      </>}
    >
      <div className="detail-head">
        <span className={`badge ${st.badge}`}><span className="dot" /> {st.label}</span>
        {urgent && <span className="badge badge-naranja"><span className="dot" /> {campaign.deadlineHours}h restantes</span>}
      </div>
      <div className="detail-meta">
        <div><span>Videos</span><strong>{campaign.videos}</strong></div>
        <div><span>Duración</span><strong>{campaign.duration}s</strong></div>
        <div><span>Estilo</span><strong>{campaign.style}</strong></div>
        <div><span>Presupuesto</span><strong>${campaign.budget.toLocaleString()} MXN</strong></div>
      </div>
      <h4 className="detail-section">Briefing</h4>
      <p className="text-muted">{campaign.brief}</p>
      <h4 className="detail-section">Resumen financiero (referencial)</h4>
      <QuoteBox q={quote(campaign.budget)} />
    </Modal>
  )
}

/* ------------------- APPLICANTS ------------------- */

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
                  <div className="text-muted rating-inline">{a.handle} · <Icon name="star" size={12} color="var(--solar)" /> {a.rating}</div>
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
        footer={<a className="btn btn-grad btn-sm" href={portfolio?.portfolio} target="_blank" rel="noreferrer">Abrir en nueva pestaña</a>}>
        {portfolio && (
          <div className="portfolio-modal">
            <div className="portfolio-frame">
              <Icon name="video" size={42} color="var(--violeta)" />
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

/* ------------------- CHAT ------------------- */

function Chat({ onCreated }) {
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
              {m.file && <span className="bubble-file"><Icon name="paperclip" size={14} /> {m.file} <em>(2.1 MB)</em></span>}
              <p>{m.text}</p>
              <span className="bubble-time">{m.time}</span>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <button className="chat-attach" title="Adjuntar referencia (máx 5MB)" type="button"><Icon name="paperclip" size={18} /></button>
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
        <button className="btn btn-grad btn-block" onClick={() => setOrderOpen(true)}><Icon name="shield" size={16} color="#fff" /> Crear orden</button>
        <p className="hint">Al crear la orden, la creadora la acepta y se redirige a Stripe para el pago en escrow.</p>
      </aside>

      <CreateOrderModal open={orderOpen} onClose={() => setOrderOpen(false)} onCreated={onCreated} />
    </div>
  )
}

function CreateOrderModal({ open, onClose, onCreated }) {
  const { addOrder } = useStore()
  const [base, setBase] = useState(1500)
  const [videos, setVideos] = useState(3)
  const [deadline, setDeadline] = useState('2026-06-04')
  const [step, setStep] = useState('form') // form | checkout | done
  const q = quote(base || 0)
  const tooLow = base < MIN_VIDEO_PRICE

  const reset = () => { setStep('form'); setBase(1500); setVideos(3); onClose() }

  const pay = async () => {
    // TODO Fase 3: reemplazar por Edge Function + Stripe Checkout (escrow real).
    // campana_id y creadora_id serán dinámicos cuando campañas y postulaciones
    // estén en Supabase. Por ahora se envía sin FK para probar el flujo base.
    await addOrder({ videos, base, deadline })
    setStep('done')
  }

  const finish = () => { reset(); onCreated && onCreated() }

  return (
    <Modal open={open} onClose={reset}
      title={step === 'form' ? 'Crear orden' : step === 'checkout' ? 'Checkout Stripe (escrow)' : 'Orden activa'}
      footer={
        step === 'form' ? (
          <button className="btn btn-grad btn-sm" disabled={tooLow} onClick={() => setStep('checkout')}>Continuar al pago</button>
        ) : step === 'checkout' ? (
          <button className="btn btn-grad btn-sm" onClick={pay}>Pagar ${q.brandPays.toLocaleString()} MXN</button>
        ) : (
          <button className="btn btn-grad btn-sm" onClick={finish}>Ir a Órdenes</button>
        )
      }>
      {step === 'form' && (
        <>
          <div className="grid-2">
            <div className="field"><label>Cantidad de videos</label><input className="input" type="number" value={videos} onChange={(e) => setVideos(Number(e.target.value))} /></div>
            <div className="field"><label>Fecha límite</label><input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
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
          <div className="done-check"><Icon name="check" size={28} color="var(--verde)" strokeWidth={3} /></div>
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

/* ------------------- ORDERS ------------------- */

function Orders() {
  const { orders, requestCorrection, approveOrder, failOrder } = useStore()
  const [correction, setCorrection] = useState(null) // { order }

  return (
    <>
      <div className="grid orders-grid">
        {orders.map((o) => {
          const st = STATUS_MAP[o.status]
          const q = quote(o.base)
          const urgent = o.deadlineHours > 0 && o.deadlineHours < 24
          return (
            <div key={o.id} className="card card-pad order-card">
              <div className="order-head">
                <span className={`badge ${st.badge}`}><span className="dot" /> {st.label}</span>
                {urgent && o.status === 'en_curso' && <span className="badge badge-naranja"><span className="dot" /> {o.deadlineHours}h</span>}
              </div>
              <h3>{o.campaign}</h3>
              <div className="order-meta">
                <span><Icon name="user" size={14} /> {o.creator}</span>
                <span><Icon name="video" size={14} /> {o.videos} videos</span>
                <span><Icon name="calendar" size={14} /> {o.deadline}</span>
              </div>
              <div className="quote-row total"><span>En escrow</span><strong>${q.brandPays.toLocaleString()} MXN</strong></div>

              {o.corrections > 0 && o.status !== 'cancelado' && (
                <p className="hint corrections-tag">
                  <Icon name="hourglass" size={13} /> Ronda de correcciones {o.corrections}/2
                </p>
              )}

              {o.status === 'entregado' && (
                <div className="order-delivery">
                  <a className="link-azul" href={o.deliveryUrl || '#'} target="_blank" rel="noreferrer"><Icon name="external" size={14} /> Ver entrega</a>
                  <div className="order-actions">
                    {o.corrections < 2
                      ? <button className="btn btn-ghost btn-sm" onClick={() => setCorrection(o)}>
                          Solicitar corrección{o.corrections > 0 ? ` (${o.corrections}/2)` : ''}
                        </button>
                      : <button className="btn btn-ghost btn-sm btn-warn" onClick={() => failOrder(o.id, 'Contenido sigue sin alinearse al briefing tras 2 rondas.')}>Marcar como fallida</button>
                    }
                    <button className="btn btn-primary btn-sm" onClick={() => approveOrder(o.id)}>Aprobar y liberar</button>
                  </div>
                </div>
              )}

              {o.status === 'en_curso' && <p className="hint">Esperando entrega de la creadora.</p>}
              {o.status === 'completado' && <p className="hint hint-ok"><Icon name="check" size={14} color="var(--verde)" strokeWidth={2.5} /> Fondos liberados a la creadora.</p>}
              {o.status === 'cancelado' && (
                <>
                  <p className="hint" style={{ color: 'var(--naranja)' }}>Orden cancelada / fallida. El capital se devuelve a la marca.</p>
                  {o.correctionNote && <p className="hint">Motivo: {o.correctionNote}</p>}
                </>
              )}
            </div>
          )
        })}
      </div>

      <CorrectionModal
        order={correction}
        onClose={() => setCorrection(null)}
        onSend={(note) => { requestCorrection(correction.id, note); setCorrection(null) }}
      />
    </>
  )
}

function CorrectionModal({ order, onClose, onSend }) {
  const [note, setNote] = useState('')
  if (!order) return null
  const nextRound = order.corrections + 1
  const willCancel = nextRound > 2

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={`Solicitar corrección · Ronda ${Math.min(nextRound, 2)}/2`}
      footer={
        <button
          className={`btn btn-sm ${willCancel ? 'btn-warn' : 'btn-grad'}`}
          disabled={!note.trim()}
          onClick={() => onSend(note.trim())}
        >
          {willCancel ? 'Cancelar orden' : `Enviar corrección (${nextRound}/2)`}
        </button>
      }
    >
      <div className="info-banner">
        <strong>Política PRD §7.1:</strong> tienes un máximo de 2 rondas de correcciones creativas.
        {' '}Los enlaces rotos o videos que no correspondan al producto no cuentan como ronda.
      </div>
      <div className="field">
        <label>Comentarios para la creadora</label>
        <textarea
          className="textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Sé específico: qué ajustar, encuadre, iluminación, mención del producto, etc."
        />
        {willCancel && <p className="err">Excederías el límite de rondas. La orden quedará como “Cancelada/Fallida” y el capital se devuelve.</p>}
      </div>
    </Modal>
  )
}
