import { useState, useEffect, useCallback } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import Modal from '../components/Modal.jsx'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { supabase } from '../lib/supabase.js'
import UrgentBanner from '../components/UrgentBanner.jsx'
import { APPLICANTS, CHAT_MESSAGES, STATUS_MAP, quote, MIN_VIDEO_PRICE } from '../data/mock.js'

const PLAN_LIMITS = { foru: 3, starter: 6, pro: 12 }

const NAV = [
  { id: 'campaigns', label: 'Campanas',        icon: 'megaphone' },
  { id: 'applicants', label: 'Postulantes',    icon: 'users', badge: APPLICANTS.length },
  { id: 'chat',       label: 'Chat',           icon: 'chat' },
  { id: 'orders',     label: 'Ordenes Escrow', icon: 'shield' },
]

export default function BrandDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('campaigns')
  const [brandName, setBrandName] = useState('')
  const [plan, setPlan] = useState('starter')

  // Cargar nombre comercial y plan desde la tabla `marcas`.
  useEffect(() => {
    if (!user || !supabase) return
    supabase
      .from('marcas')
      .select('nombre_comercial, plan')
      .eq('perfil_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setBrandName(data.nombre_comercial)
          setPlan(data.plan)
        }
      })
  }, [user])

  return (
    <DashboardShell
      nav={NAV}
      active={tab}
      onNavigate={setTab}
      accent="var(--rosa)"
      title={{
        campaigns:  'Mis campanas',
        applicants: 'Postulantes',
        chat:       'Chat de negociacion',
        orders:     'Ordenes y Escrow',
      }[tab]}
      subtitle={'Panel de marca - ' + (brandName || user?.name || 'Marca')}
    >
      {tab !== 'chat' && <UrgentBanner role="brand" onJumpToOrders={() => setTab('orders')} />}
      {tab === 'campaigns'  && <Campaigns brandId={user?.id} plan={plan} onOpenApplicants={() => setTab('applicants')} />}
      {tab === 'applicants' && <Applicants onOpenChat={() => setTab('chat')} />}
      {tab === 'chat'       && <Chat onCreated={() => setTab('orders')} />}
      {tab === 'orders'     && <Orders />}
    </DashboardShell>
  )
}

/* ---- CAMPANAS ---- */

function Campaigns({ brandId, plan, onOpenApplicants }) {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading]     = useState(true)
  const [newOpen, setNewOpen]     = useState(false)
  const [detail, setDetail]       = useState(null)

  const fetchCampaigns = useCallback(async () => {
    if (!brandId || !supabase) return
    setLoading(true)
    const { data } = await supabase
      .from('campanas')
      .select('id, titulo, brief, estilo, duracion_seg, videos, presupuesto, status, deadline_hours, created_at')
      .eq('marca_id', brandId)
      .order('created_at', { ascending: false })
    if (data) setCampaigns(data)
    setLoading(false)
  }, [brandId])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const onCreated = (camp) => {
    setCampaigns((prev) => [camp, ...prev])
    setNewOpen(false)
  }

  const limit    = PLAN_LIMITS[plan] ?? 6
  const activas  = campaigns.filter((c) => c.status === 'activa').length

  if (loading) {
    return <div className="card card-pad center"><p className="text-muted">Cargando campanas...</p></div>
  }

  return (
    <>
      <div className="toolbar">
        <p className="text-muted">
          {activas} de {limit} campanas activas usadas - plan <strong>{plan}</strong>
        </p>
        <button className="btn btn-grad btn-sm" onClick={() => setNewOpen(true)}>
          <Icon name="plus" size={14} color="#fff" /> Nueva campana
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="card card-pad center">
          <Icon name="megaphone" size={32} color="var(--rosa)" />
          <p className="text-muted" style={{ marginTop: 12 }}>
            Aun no tienes campanas. Crea tu primera para empezar a recibir postulaciones.
          </p>
          <button className="btn btn-grad btn-sm" style={{ marginTop: 12 }} onClick={() => setNewOpen(true)}>
            Crear campana
          </button>
        </div>
      ) : (
        <div className="grid cards-grid">
          {campaigns.map((c) => {
            const st     = STATUS_MAP[c.status] ?? STATUS_MAP['borrador']
            const urgent = c.deadline_hours != null && c.deadline_hours < 24 && c.deadline_hours > 0
            return (
              <div key={c.id} className="card card-pad camp-card">
                <div className="camp-top">
                  <span className={'badge ' + st.badge}><span className="dot" /> {st.label}</span>
                  {urgent && (
                    <span className="badge badge-naranja">
                      <span className="dot" /> {c.deadline_hours}h restantes
                    </span>
                  )}
                </div>
                <h3>{c.titulo}</h3>
                <p className="text-muted">{c.brief}</p>
                <div className="camp-meta">
                  <span><Icon name="video"   size={14} /> {c.videos} videos - {c.duracion_seg}s</span>
                  <span><Icon name="palette" size={14} /> {c.estilo}</span>
                  <span><Icon name="money"   size={14} /> ${Number(c.presupuesto).toLocaleString()} MXN</span>
                </div>
                <div className="camp-foot">
                  <span className="text-muted">
                    {c.status === 'borrador'  && 'Borrador - no visible'}
                    {c.status === 'pendiente' && 'En revision por admin'}
                    {c.status === 'activa'    && 'Publica en marketplace'}
                    {c.status === 'cerrada'   && 'Cerrada'}
                    {c.status === 'rechazada' && 'Rechazada por admin'}
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDetail(c)}>Ver detalle</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <NewCampaignModal
        open={newOpen}
        brandId={brandId}
        onClose={() => setNewOpen(false)}
        onCreated={onCreated}
      />
      <CampaignDetailModal
        campaign={detail}
        onClose={() => setDetail(null)}
        onOpenApplicants={() => { setDetail(null); onOpenApplicants() }}
      />
    </>
  )
}

function NewCampaignModal({ open, brandId, onClose, onCreated }) {
  const [form, setForm] = useState({
    titulo: '', brief: '', estilo: 'UGC', duracion_seg: 30, videos: 3, presupuesto: '',
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    const presupuesto = Number(form.presupuesto)
    if (presupuesto < MIN_VIDEO_PRICE) {
      setErr('El presupuesto minimo es $' + MIN_VIDEO_PRICE + ' MXN.')
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('campanas')
      .insert({
        marca_id:    brandId,
        titulo:      form.titulo,
        brief:       form.brief,
        estilo:      form.estilo,
        duracion_seg: Number(form.duracion_seg),
        videos:      Number(form.videos),
        presupuesto,
        status:      'pendiente', // va a pre-aprobacion del admin
      })
      .select()
      .single()

    if (error) {
      setErr('Error al crear la campana. Intenta de nuevo.')
      setLoading(false)
      return
    }
    setForm({ titulo: '', brief: '', estilo: 'UGC', duracion_seg: 30, videos: 3, presupuesto: '' })
    setLoading(false)
    onCreated(data)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva campana (briefing)"
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-grad btn-sm" form="new-camp-form" type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar a pre-aprobacion'}
          </button>
        </>
      }
    >
      <form id="new-camp-form" onSubmit={submit}>
        <div className="field">
          <label>Titulo de la campana</label>
          <input className="input" required value={form.titulo} onChange={set('titulo')} placeholder="Ej. Unboxing serum facial" />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Duracion por video (segundos)</label>
            <input className="input" type="number" min="5" required value={form.duracion_seg} onChange={set('duracion_seg')} />
          </div>
          <div className="field">
            <label>Cantidad de videos</label>
            <input className="input" type="number" min="1" required value={form.videos} onChange={set('videos')} />
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Estilo narrativo</label>
            <select className="select" value={form.estilo} onChange={set('estilo')}>
              <option>UGC</option>
              <option>Unboxing</option>
              <option>Resena</option>
              <option>Acting</option>
            </select>
          </div>
          <div className="field">
            <label>Presupuesto total (MXN)</label>
            <input className="input" type="number" min={MIN_VIDEO_PRICE} required value={form.presupuesto} onChange={set('presupuesto')} placeholder="Ej. 1500" />
          </div>
        </div>
        <div className="field">
          <label>Requerimientos y especificaciones</label>
          <textarea className="textarea" value={form.brief} onChange={set('brief')} placeholder="Tono, iluminacion, encuadre, menciones obligatorias..." />
        </div>
        {err && <p className="err">{err}</p>}
        <p className="hint">Tu campana pasa por pre-aprobacion de un admin antes de hacerse publica en el marketplace.</p>
      </form>
    </Modal>
  )
}

function CampaignDetailModal({ campaign, onClose, onOpenApplicants }) {
  if (!campaign) return null
  const st     = STATUS_MAP[campaign.status] ?? STATUS_MAP['borrador']
  const urgent = campaign.deadline_hours != null && campaign.deadline_hours < 24 && campaign.deadline_hours > 0

  return (
    <Modal
      open={!!campaign}
      onClose={onClose}
      title={'Detalle - ' + campaign.titulo}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cerrar</button>
          <button className="btn btn-grad btn-sm" onClick={onOpenApplicants}>
            Ver postulantes
          </button>
        </>
      }
    >
      <div className="detail-head">
        <span className={'badge ' + st.badge}><span className="dot" /> {st.label}</span>
        {urgent && <span className="badge badge-naranja"><span className="dot" /> {campaign.deadline_hours}h restantes</span>}
      </div>
      <div className="detail-meta">
        <div><span>Videos</span><strong>{campaign.videos}</strong></div>
        <div><span>Duracion</span><strong>{campaign.duracion_seg}s</strong></div>
        <div><span>Estilo</span><strong>{campaign.estilo}</strong></div>
        <div><span>Presupuesto</span><strong>${Number(campaign.presupuesto).toLocaleString()} MXN</strong></div>
      </div>
      <h4 className="detail-section">Briefing</h4>
      <p className="text-muted">{campaign.brief || 'Sin briefing especificado.'}</p>
      <h4 className="detail-section">Resumen financiero (referencial)</h4>
      <QuoteBox q={quote(Number(campaign.presupuesto))} />
    </Modal>
  )
}

/* ---- POSTULANTES (aun mock, se migra en Fase C) ---- */

function Applicants({ onOpenChat }) {
  const [portfolio, setPortfolio] = useState(null)
  return (
    <>
      <p className="text-muted toolbar">
        Campana: <strong>Unboxing serum facial - linea Glow</strong>
      </p>
      <div className="grid cards-grid">
        {APPLICANTS.map((a) => {
          const q = quote(a.price * 3)
          return (
            <div key={a.id} className="card card-pad applicant-card">
              <div className="applicant-head">
                <div className="dash-avatar lg">{a.name.charAt(0)}</div>
                <div>
                  <strong>{a.name}</strong>
                  <div className="text-muted rating-inline">
                    {a.handle} - <Icon name="star" size={12} color="var(--solar)" /> {a.rating}
                  </div>
                </div>
                {a.verified
                  ? <span className="badge badge-verde"><span className="dot" /> Verificada</span>
                  : <span className="badge badge-solar"><span className="dot" /> Pendiente</span>}
              </div>
              <p className="applicant-proposal">"{a.proposal}"</p>
              <div className="applicant-price">
                <span>Propuesta: <strong>${a.price} MXN/video</strong></span>
                <span className="text-muted">Total marca aprox. ${q.brandPays.toLocaleString()}</span>
              </div>
              <div className="applicant-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => setPortfolio(a)}>Ver portafolio</button>
                <button className="btn btn-primary btn-sm" onClick={onOpenChat}>Iniciar chat</button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        open={!!portfolio}
        onClose={() => setPortfolio(null)}
        title={portfolio ? ('Portafolio - ' + portfolio.name) : ''}
        footer={
          <a className="btn btn-grad btn-sm" href={portfolio?.portfolio} target="_blank" rel="noreferrer">
            Abrir en nueva pestana
          </a>
        }
      >
        {portfolio && (
          <div className="portfolio-modal">
            <div className="portfolio-frame">
              <Icon name="video" size={42} color="var(--violeta)" />
              <p>Vista previa del portafolio externo</p>
              <code>{portfolio.portfolio}</code>
            </div>
            <p className="text-muted">El portafolio se abre en un modal para no perder tu flujo de revision.</p>
          </div>
        )}
      </Modal>
    </>
  )
}

/* ---- CHAT (aun mock, se migra en Fase D) ---- */

function Chat({ onCreated }) {
  const [orderOpen, setOrderOpen] = useState(false)
  return (
    <div className="chat-layout">
      <div className="chat-main card">
        <div className="chat-head">
          <div className="dash-avatar">V</div>
          <div>
            <strong>Valentina Rios</strong>
            <div className="text-muted" style={{ fontSize: 13 }}>@valeugc - Glow serum</div>
          </div>
          <span className="badge badge-verde" style={{ marginLeft: 'auto' }}><span className="dot" /> En linea</span>
        </div>
        <div className="chat-body">
          {CHAT_MESSAGES.map((m) => (
            <div key={m.id} className={'bubble ' + (m.from === 'brand' ? 'me' : 'them')}>
              {m.file && (
                <span className="bubble-file">
                  <Icon name="paperclip" size={14} /> {m.file} <em>(2.1 MB)</em>
                </span>
              )}
              <p>{m.text}</p>
              <span className="bubble-time">{m.time}</span>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <button className="chat-attach" title="Adjuntar referencia (max 5MB)" type="button">
            <Icon name="paperclip" size={18} />
          </button>
          <input className="input" placeholder="Escribe un mensaje..." />
          <button className="btn btn-primary btn-sm">Enviar</button>
        </div>
        <p className="chat-note">Archivos de referencia hasta 5MB. Prohibido subir videos finales aqui.</p>
      </div>

      <aside className="chat-side card card-pad">
        <h3>Resumen de la colaboracion</h3>
        <ul className="chat-summary">
          <li><span>Campana</span><strong>Glow serum</strong></li>
          <li><span>Videos</span><strong>3 x 30s</strong></li>
          <li><span>Acuerdo verbal</span><strong>$1,500 MXN</strong></li>
        </ul>
        <button className="btn btn-grad btn-block" onClick={() => setOrderOpen(true)}>
          <Icon name="shield" size={16} color="#fff" /> Crear orden
        </button>
        <p className="hint">Al crear la orden se genera el pago en escrow via Stripe.</p>
      </aside>

      <CreateOrderModal open={orderOpen} onClose={() => setOrderOpen(false)} onCreated={onCreated} />
    </div>
  )
}

function CreateOrderModal({ open, onClose, onCreated }) {
  const { addOrder } = useStore()
  const [base, setBase]       = useState(1500)
  const [videos, setVideos]   = useState(3)
  const [deadline, setDeadline] = useState('2026-06-04')
  const [step, setStep]       = useState('form')
  const q      = quote(base || 0)
  const tooLow = base < MIN_VIDEO_PRICE

  const reset = () => { setStep('form'); setBase(1500); setVideos(3); onClose() }

  const pay = async () => {
    await addOrder({ videos, base, deadline })
    setStep('done')
  }

  const finish = () => { reset(); onCreated && onCreated() }

  return (
    <Modal
      open={open}
      onClose={reset}
      title={
        step === 'form'     ? 'Crear orden' :
        step === 'checkout' ? 'Checkout Stripe (escrow)' :
                              'Orden activa'
      }
      footer={
        step === 'form' ? (
          <button className="btn btn-grad btn-sm" disabled={tooLow} onClick={() => setStep('checkout')}>
            Continuar al pago
          </button>
        ) : step === 'checkout' ? (
          <button className="btn btn-grad btn-sm" onClick={pay}>
            Pagar ${q.brandPays.toLocaleString()} MXN
          </button>
        ) : (
          <button className="btn btn-grad btn-sm" onClick={finish}>Ir a Ordenes</button>
        )
      }
    >
      {step === 'form' && (
        <>
          <div className="grid-2">
            <div className="field">
              <label>Cantidad de videos</label>
              <input className="input" type="number" value={videos} onChange={(e) => setVideos(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Fecha limite</label>
              <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Precio base totalizado (MXN)</label>
            <input className="input" type="number" value={base} onChange={(e) => setBase(Number(e.target.value))} />
            {tooLow && <p className="err">El acuerdo no puede ser menor a ${MIN_VIDEO_PRICE} MXN por video (PRD 5.2).</p>}
          </div>
          <QuoteBox q={q} />
        </>
      )}
      {step === 'checkout' && (
        <div className="checkout">
          <div className="stripe-badge">Pago seguro - <strong>Stripe</strong></div>
          <div className="field">
            <label>Numero de tarjeta</label>
            <input className="input" placeholder="4242 4242 4242 4242" />
          </div>
          <div className="grid-2">
            <div className="field"><label>Vence</label><input className="input" placeholder="MM/AA" /></div>
            <div className="field"><label>CVC</label><input className="input" placeholder="123" /></div>
          </div>
          <QuoteBox q={q} />
          <p className="hint">El capital se congela en garantia (escrow) y se libera al aprobar el contenido.</p>
        </div>
      )}
      {step === 'done' && (
        <div className="order-done">
          <div className="done-check"><Icon name="check" size={28} color="var(--verde)" strokeWidth={3} /></div>
          <h3 style={{ color: 'var(--verde)' }}>Fondos en escrow</h3>
          <p className="text-muted">
            La orden paso a <strong>Colaboracion en curso</strong>.
            ${q.brandPays.toLocaleString()} MXN quedaron congelados de forma segura.
          </p>
        </div>
      )}
    </Modal>
  )
}

function QuoteBox({ q }) {
  return (
    <div className="quote-box">
      <div className="quote-row"><span>Costo base pactado</span><strong>${q.base.toLocaleString()}</strong></div>
      <div className="quote-row"><span>Comision marca (+15%)</span><strong>+${(q.brandPays - q.base).toLocaleString()}</strong></div>
      <div className="quote-row total"><span>Pagas en checkout</span><strong>${q.brandPays.toLocaleString()} MXN</strong></div>
      <div className="quote-divider" />
      <div className="quote-row sub"><span>Creadora recibe (-5%)</span><strong>${q.creatorGets.toLocaleString()}</strong></div>
      <div className="quote-row sub"><span>Mimosa retiene (20%)</span><strong>${q.mimosa.toLocaleString()}</strong></div>
    </div>
  )
}

/* ---- ORDENES ---- */

function Orders() {
  const { orders, requestCorrection, approveOrder, failOrder } = useStore()
  const [correction, setCorrection] = useState(null)

  if (orders.length === 0) {
    return (
      <div className="card card-pad center">
        <Icon name="shield" size={32} color="var(--rosa)" />
        <p className="text-muted" style={{ marginTop: 12 }}>
          No tienes ordenes activas. Crea una desde el Chat una vez acuerdes terminos con una creadora.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid orders-grid">
        {orders.map((o) => {
          const st     = STATUS_MAP[o.status]
          const q      = quote(o.base)
          const urgent = o.deadlineHours > 0 && o.deadlineHours < 24
          return (
            <div key={o.id} className="card card-pad order-card">
              <div className="order-head">
                <span className={'badge ' + st.badge}><span className="dot" /> {st.label}</span>
                {urgent && o.status === 'en_curso' && (
                  <span className="badge badge-naranja"><span className="dot" /> {o.deadlineHours}h</span>
                )}
              </div>
              <h3>{o.campaign || 'Orden'}</h3>
              <div className="order-meta">
                <span><Icon name="user"     size={14} /> {o.creator || 'Creadora'}</span>
                <span><Icon name="video"    size={14} /> {o.videos} videos</span>
                <span><Icon name="calendar" size={14} /> {o.deadline}</span>
              </div>
              <div className="quote-row total">
                <span>En escrow</span><strong>${q.brandPays.toLocaleString()} MXN</strong>
              </div>

              {o.corrections > 0 && o.status !== 'cancelado' && (
                <p className="hint corrections-tag">
                  <Icon name="hourglass" size={13} /> Ronda de correcciones {o.corrections}/2
                </p>
              )}

              {o.status === 'entregado' && (
                <div className="order-delivery">
                  <a className="link-azul" href={o.deliveryUrl || '#'} target="_blank" rel="noreferrer">
                    <Icon name="external" size={14} /> Ver entrega
                  </a>
                  <div className="order-actions">
                    {o.corrections < 2
                      ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => setCorrection(o)}>
                          Solicitar correccion{o.corrections > 0 ? (' (' + o.corrections + '/2)') : ''}
                        </button>
                      )
                      : (
                        <button
                          className="btn btn-ghost btn-sm btn-warn"
                          onClick={() => failOrder(o.id, 'Contenido sin alinear al briefing tras 2 rondas.')}
                        >
                          Marcar como fallida
                        </button>
                      )
                    }
                    <button className="btn btn-primary btn-sm" onClick={() => approveOrder(o.id)}>
                      Aprobar y liberar
                    </button>
                  </div>
                </div>
              )}

              {o.status === 'en_curso'   && <p className="hint">Esperando entrega de la creadora.</p>}
              {o.status === 'completado' && (
                <p className="hint hint-ok">
                  <Icon name="check" size={14} color="var(--verde)" strokeWidth={2.5} /> Fondos liberados a la creadora.
                </p>
              )}
              {o.status === 'cancelado' && (
                <>
                  <p className="hint" style={{ color: 'var(--naranja)' }}>
                    Orden cancelada. El capital se devuelve a la marca.
                  </p>
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
  const nextRound  = order.corrections + 1
  const willCancel = nextRound > 2

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={'Solicitar correccion - Ronda ' + Math.min(nextRound, 2) + '/2'}
      footer={
        <button
          className={'btn btn-sm ' + (willCancel ? 'btn-warn' : 'btn-grad')}
          disabled={!note.trim()}
          onClick={() => onSend(note.trim())}
        >
          {willCancel ? 'Cancelar orden' : ('Enviar correccion (' + nextRound + '/2)')}
        </button>
      }
    >
      <div className="info-banner">
        <strong>PRD 7.1:</strong> maximo 2 rondas de correcciones creativas.
        Los enlaces rotos o videos que no correspondan al producto no cuentan como ronda.
      </div>
      <div className="field">
        <label>Comentarios para la creadora</label>
        <textarea
          className="textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Se especifico: que ajustar, encuadre, iluminacion, mencion del producto, etc."
        />
        {willCancel && (
          <p className="err">
            Excederias el limite de rondas. La orden quedara como Cancelada y el capital se devuelve.
          </p>
        )}
      </div>
    </Modal>
  )
}
