import { useState, useEffect, useCallback, useRef } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import Modal from '../components/Modal.jsx'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { supabase } from '../lib/supabase.js'
import UrgentBanner from '../components/UrgentBanner.jsx'
import { MARKET_STYLES, STATUS_MAP, quote, MIN_VIDEO_PRICE } from '../data/mock.js'
import { sendEmail } from '../lib/email.js'

const GRADS = [
  'var(--grad-naranja-solar)',
  'var(--grad-solar-rosa)',
  'var(--grad-rosa-violeta)',
  'var(--grad-violeta-azul)',
  'var(--grad-verde-azul)',
]

const PAGE_SIZE = 6

const NAV = [
  { id: 'home',    label: 'Inicio',              icon: 'home' },
  { id: 'market',  label: 'Marketplace',          icon: 'shop' },
  { id: 'orders',  label: 'Mis órdenes',           icon: 'video' },
  { id: 'chat',    label: 'Chat',                  icon: 'chat' },
  { id: 'finance', label: 'Verificación CLABE',    icon: 'bank' },
]

export default function CreatorDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('home')
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!user || !supabase) return
    supabase
      .from('creadoras')
      .select('status')
      .eq('perfil_id', user.id)
      .single()
      .then(({ data }) => setStatus(data?.status ?? 'en_validacion'))
  }, [user])

  return (
    <DashboardShell
      nav={NAV}
      active={tab}
      onNavigate={setTab}
      accent="var(--solar)"
      title={{
        home:    'Inicio',
        market:  'Marketplace de campañas',
        orders:  'Mis órdenes',
        chat:    'Chat de negociación',
        finance: 'Verificación financiera',
      }[tab]}
      subtitle={`Panel de creadora · ${user?.name || 'Creadora'}`}
    >
      {tab !== 'finance' && <UrgentBanner role="creator" onJumpToOrders={() => setTab('orders')} />}
      {tab === 'home'    && <Home status={status} userId={user?.id} goMarket={() => setTab('market')} onStatusChange={setStatus} />}
      {tab === 'market'  && <Marketplace locked={status !== 'verificado'} />}
      {tab === 'orders'  && <Orders />}
      {tab === 'chat'    && <Chat userId={user?.id} />}
      {tab === 'finance' && <Finance />}
    </DashboardShell>
  )
}

function Home({ status, userId, goMarket, onStatusChange }) {
  const [stats, setStats]       = useState(null)
  const [feedback, setFeedback] = useState(null)   // último feedback de admin
  const [newPortfolio, setNewPortfolio] = useState('')
  const [reenviarLoading, setReenviarLoading] = useState(false)

  useEffect(() => {
    if (status !== 'verificado' || !userId || !supabase) return

    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    Promise.all([
      // Órdenes activas (en_curso)
      supabase
        .from('ordenes')
        .select('id', { count: 'exact', head: true })
        .eq('creadora_id', userId)
        .eq('status', 'en_curso'),
      // Ingresos del mes (completadas este mes)
      supabase
        .from('ordenes')
        .select('creator_gets')
        .eq('creadora_id', userId)
        .eq('status', 'completado')
        .gte('created_at', inicioMes.toISOString()),
      // Total de postulaciones enviadas
      supabase
        .from('postulaciones')
        .select('id', { count: 'exact', head: true })
        .eq('creadora_id', userId),
      // Calificación: promedio basado en correcciones de órdenes completadas
      // (5 sin correcciones, 4 con 1, 3 con 2)
      supabase
        .from('ordenes')
        .select('corrections_used')
        .eq('creadora_id', userId)
        .eq('status', 'completado'),
    ]).then(([activas, ingresos, posts, completadas]) => {
      const totalIngresos = (ingresos.data ?? []).reduce(
        (sum, o) => sum + Number(o.creator_gets), 0
      )
      const ordenesOk = completadas.data ?? []
      let calificacion = null
      if (ordenesOk.length > 0) {
        const suma = ordenesOk.reduce((s, o) => s + (5 - (o.corrections_used ?? 0)), 0)
        calificacion = (suma / ordenesOk.length).toFixed(1)
      }
      setStats({
        activas:       activas.count ?? 0,
        ingresos:      totalIngresos,
        postulaciones: posts.count   ?? 0,
        calificacion,
      })
    })
  }, [status, userId])

  // Cuando el perfil vuelve a 'borrador' por rechazo, cargamos el último feedback.
  useEffect(() => {
    if (status !== 'borrador' || !userId || !supabase) return
    supabase
      .from('feedback_validacion')
      .select('mensaje, created_at')
      .eq('creadora_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => { if (data) setFeedback(data) })
  }, [status, userId])

  const reenviar = async () => {
    if (reenviarLoading) return
    const url = newPortfolio.trim()
    if (url && !/^https?:\/\/.+\..+/.test(url)) return
    setReenviarLoading(true)
    const update = { status: 'en_validacion' }
    if (url) update.portafolio_url = url
    await supabase.from('creadoras').update(update).eq('perfil_id', userId)
    onStatusChange('en_validacion')
    setReenviarLoading(false)
  }

  if (status === 'loading') {
    return <div className="card card-pad center"><p className="text-muted">Cargando tu perfil...</p></div>
  }

  // 'borrador' con feedback = fue rechazada y debe corregir su portafolio
  if (status === 'borrador' && feedback) {
    const portValid = !newPortfolio.trim() || /^https?:\/\/.+\..+/.test(newPortfolio.trim())
    return (
      <div className="card card-pad validation-card">
        <span className="badge badge-naranja"><span className="dot" /> Portafolio rechazado</span>
        <h2>Tu portafolio necesita ajustes</h2>
        <p className="text-muted">
          Revisamos tu portafolio y por el momento no cumple con los requisitos de Mimosa.
          Lee el feedback, actualiza tu enlace si es necesario y reenvía para validación.
        </p>

        <div className="feedback-box">
          <strong>Feedback del equipo Mimosa:</strong>
          <p>"{feedback.mensaje}"</p>
          <span className="text-muted" style={{ fontSize: 12 }}>
            {new Date(feedback.created_at).toLocaleDateString('es-MX')}
          </span>
        </div>

        <div className="field" style={{ marginTop: 20 }}>
          <label>Actualiza tu enlace de portafolio (opcional)</label>
          <input
            className="input"
            value={newPortfolio}
            onChange={(e) => setNewPortfolio(e.target.value)}
            placeholder="https://behance.net/tuperfil (deja vacío para mantener el actual)"
          />
          {newPortfolio && !portValid && (
            <p className="err">Ingresa un enlace válido (https://…).</p>
          )}
        </div>

        <button
          className="btn btn-grad"
          style={{ marginTop: 8 }}
          onClick={reenviar}
          disabled={reenviarLoading || (newPortfolio && !portValid)}
        >
          {reenviarLoading ? 'Enviando…' : 'Reenviar para validación'}
        </button>
      </div>
    )
  }

  // 'borrador' sin feedback = perfil recién creado, no ha sido revisado aún
  // 'en_validacion' = esperando revisión del admin
  if (status === 'en_validacion' || status === 'borrador') {
    return (
      <div className="card card-pad validation-card">
        <span className="badge badge-solar"><span className="dot" /> En validación</span>
        <h2>Tu perfil está en revisión</h2>
        <p className="text-muted">
          Un administrador de Mimosa está auditando tu portafolio. Mientras tanto, tu acceso al
          marketplace está bloqueado. Te avisaremos por correo cuando haya respuesta.
        </p>
        <ol className="validation-steps">
          <li className="done"><Icon name="check" size={14} strokeWidth={2.5} /> Formulario y portafolio enviados</li>
          <li className="active"><span className="dot-pulse" /> Auditoría humana del portafolio</li>
          <li>Verificación financiera (CLABE)</li>
          <li>Acceso total al marketplace</li>
        </ol>
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
        <Stat
          label="Órdenes activas"
          value={stats ? String(stats.activas) : '…'}
          grad="var(--grad-rosa-violeta)"
        />
        <Stat
          label="Ingresos del mes"
          value={stats ? ('$' + stats.ingresos.toLocaleString('es-MX', { maximumFractionDigits: 0 })) : '…'}
          grad="var(--grad-verde-azul)"
        />
        <Stat
          label="Postulaciones"
          value={stats ? String(stats.postulaciones) : '…'}
          grad="var(--grad-solar-rosa)"
        />
        <Stat label="Calificación" value={stats ? (stats.calificacion ?? '—') : '…'} grad="var(--grad-violeta-azul)" />
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
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [applied, setApplied]     = useState(new Set())
  const [loading, setLoading]     = useState(true)
  const [apply, setApply]         = useState(null)
  const [query, setQuery]         = useState('')
  const [style, setStyle]         = useState('all')
  const [sort, setSort]           = useState('deadline')
  const [page, setPage]           = useState(1)

  const fetchCampaigns = useCallback(async () => {
    if (!supabase) return
    setLoading(true)

    const { data: camps } = await supabase
      .from('campanas')
      .select('id, titulo, brief, estilo, duracion_seg, videos, presupuesto, deadline_hours, marcas ( nombre_comercial )')
      .eq('status', 'activa')
      .order('created_at', { ascending: false })

    const { data: posts } = user ? await supabase
      .from('postulaciones')
      .select('campana_id')
      .eq('creadora_id', user.id) : { data: [] }

    if (camps) {
      setCampaigns(camps.map((c, i) => ({
        id:            c.id,
        title:         c.titulo,
        brand:         c.marcas?.nombre_comercial ?? 'Marca',
        style:         c.estilo,
        duration:      c.duracion_seg,
        videos:        c.videos,
        refBudget:     Number(c.presupuesto),
        deadlineHours: c.deadline_hours ?? 999,
        grad:          GRADS[i % GRADS.length],
      })))
    }
    if (posts) setApplied(new Set(posts.map((p) => p.campana_id)))
    setLoading(false)
  }, [user])

  useEffect(() => { if (!locked) fetchCampaigns() }, [locked, fetchCampaigns])

  if (locked) {
    return (
      <div className="card card-pad center inline-ic">
        <Icon name="lock" size={18} />
        <p className="text-muted" style={{ margin: 0 }}>
          Tu perfil aun esta en validacion. No puedes aplicar a campanas todavia.
        </p>
      </div>
    )
  }

  if (loading) {
    return <div className="card card-pad center"><p className="text-muted">Cargando campanas...</p></div>
  }

  const q        = query.trim().toLowerCase()
  const filtered = campaigns.filter((c) => {
    if (style !== 'all' && c.style !== style) return false
    if (!q) return true
    return c.title.toLowerCase().includes(q) || c.brand.toLowerCase().includes(q)
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'budget-desc') return b.refBudget - a.refBudget
    if (sort === 'budget-asc')  return a.refBudget - b.refBudget
    return a.deadlineHours - b.deadlineHours
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const visible    = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const onFilter   = (fn) => (e) => { fn(e.target.value); setPage(1) }

  return (
    <>
      <div className="market-toolbar">
        <div className="market-search">
          <Icon name="shop" size={16} />
          <input
            className="input"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Busca por marca o titulo de campana..."
          />
        </div>
        <div className="market-filters">
          <select className="select" value={style} onChange={onFilter(setStyle)}>
            <option value="all">Todos los estilos</option>
            {MARKET_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select" value={sort} onChange={onFilter(setSort)}>
            <option value="deadline">Vence antes</option>
            <option value="budget-desc">Presupuesto mayor</option>
            <option value="budget-asc">Presupuesto menor</option>
          </select>
        </div>
      </div>

      <p className="text-muted market-count">
        {filtered.length} {filtered.length === 1 ? 'campana' : 'campanas'}
        {q && <span> con <strong>{query}</strong></span>}
        {style !== 'all' && <span> - estilo {style}</span>}
      </p>

      {visible.length === 0 ? (
        <div className="card card-pad center" style={{ padding: 48 }}>
          <Icon name="shop" size={32} color="var(--muted)" />
          <h3 style={{ marginTop: 14, color: 'var(--ink)' }}>Sin resultados</h3>
          <p className="text-muted">
            {campaigns.length === 0
              ? 'Aun no hay campanas activas en el marketplace.'
              : 'Ajusta los filtros o la busqueda.'}
          </p>
        </div>
      ) : (
        <div className="grid cards-grid">
          {visible.map((c) => {
            const urgent      = c.deadlineHours < 24 && c.deadlineHours > 0
            const yaPostulada = applied.has(c.id)
            return (
              <div key={c.id} className="market-card">
                <div className="market-banner" style={{ background: c.grad }}>
                  <span className="badge badge-muted" style={{ background: 'rgba(255,255,255,.85)' }}>
                    {c.style}
                  </span>
                  {urgent && (
                    <span className="badge badge-naranja" style={{ background: 'rgba(255,255,255,.9)' }}>
                      <span className="dot" /> {c.deadlineHours}h
                    </span>
                  )}
                </div>
                <div className="card-pad">
                  <h3>{c.title}</h3>
                  <p className="text-muted" style={{ margin: '4px 0 12px' }}>{c.brand}</p>
                  <div className="camp-meta">
                    <span><Icon name="video" size={14} /> {c.videos} x {c.duration}s</span>
                    <span><Icon name="bulb"  size={14} /> Ref. ${c.refBudget.toLocaleString()}</span>
                  </div>
                  {yaPostulada ? (
                    <button className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 16 }} disabled>
                      Ya aplicaste
                    </button>
                  ) : (
                    <button
                      className="btn btn-grad btn-block btn-sm"
                      style={{ marginTop: 16 }}
                      onClick={() => setApply(c)}
                    >
                      Aplicar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />}

      <ApplyModal
        campaign={apply}
        onClose={() => setApply(null)}
        onApplied={(campanaId) => {
          setApplied((prev) => new Set([...prev, campanaId]))
          setApply(null)
        }}
      />
    </>
  )
}

function Pagination({ page, totalPages, onChange }) {
  const pages = []
  for (let i = 1; i <= totalPages; i++) pages.push(i)
  return (
    <nav className="pagination" aria-label="Paginación">
      <button className="page-btn" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Anterior">←</button>
      {pages.map((p) => (
        <button
          key={p}
          className={`page-btn${p === page ? ' is-active' : ''}`}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >{p}</button>
      ))}
      <button className="page-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)} aria-label="Siguiente">→</button>
    </nav>
  )
}

function ApplyModal({ campaign, onClose, onApplied }) {
  const { user } = useAuth()
  const [propuesta, setPropuesta] = useState('')
  const [price, setPrice]         = useState(500)
  const [loading, setLoading]     = useState(false)
  const [err, setErr]             = useState('')
  const tooLow = price < MIN_VIDEO_PRICE
  const q      = quote((price || 0) * (campaign?.videos || 1))

  const submit = async () => {
    if (tooLow || !user || !campaign) return
    setErr('')
    setLoading(true)

    const { error } = await supabase.from('postulaciones').insert({
      campana_id:   campaign.id,
      creadora_id:  user.id,
      propuesta:    propuesta.trim(),
      precio_video: price,
    })

    if (error) {
      setErr(error.code === '23505'
        ? 'Ya enviaste una postulacion a esta campana.'
        : 'Error al enviar. Intenta de nuevo.')
      setLoading(false)
      return
    }

    // Email a la creadora: confirmación de postulación
    sendEmail('postulacion_recibida', user.email, {
      nombre:  user.name,
      campana: campaign.title,
      marca:   campaign.brand,
    })

    // Email a la marca: tiene nueva postulante
    // Buscamos el email de la marca por campana_id
    supabase
      .from('campanas')
      .select('marca_id, perfiles!marca_id ( email, nombre )')
      .eq('id', campaign.id)
      .single()
      .then(({ data: camp }) => {
        const email = camp?.perfiles?.email
        const nombre = camp?.perfiles?.nombre
        if (email) {
          sendEmail('nueva_postulante', email, {
            nombre:   nombre ?? 'Marca',
            campana:  campaign.title,
            creadora: user.name,
          })
        }
      })

    setPropuesta('')
    setPrice(500)
    setLoading(false)
    onApplied(campaign.id)
  }

  return (
    <Modal
      open={!!campaign}
      onClose={onClose}
      title={campaign ? ('Aplicar - ' + campaign.title) : ''}
      footer={
        <button
          className="btn btn-grad btn-sm"
          disabled={tooLow || loading}
          onClick={submit}
        >
          {loading ? 'Enviando...' : 'Enviar postulacion'}
        </button>
      }
    >
      {campaign && (
        <>
          <div className="field">
            <label>Tu propuesta creativa</label>
            <textarea
              className="textarea"
              value={propuesta}
              onChange={(e) => setPropuesta(e.target.value)}
              placeholder="Describe tu idea conceptual para esta campana..."
            />
          </div>
          <div className="field">
            <label>Tu costo por video (MXN)</label>
            <input
              className="input"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
            {tooLow
              ? <p className="err">El minimo es ${MIN_VIDEO_PRICE} MXN por video (PRD 5.2).</p>
              : <p className="hint">
                  Por {campaign.videos} videos recibiras aprox. ${q.creatorGets.toLocaleString()} MXN netos (tras 5%).
                </p>
            }
          </div>
          {err && <p className="err">{err}</p>}
        </>
      )}
    </Modal>
  )
}

function Orders() {
  const { orders, deliverOrder } = useStore()
  const [deliver, setDeliver] = useState(null)
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
                {urgent && <span className="badge badge-naranja"><span className="dot" /> {o.deadlineHours}h</span>}
              </div>
              <h3>{o.campaign}</h3>
              <div className="order-meta">
                <span><Icon name="building" size={14} /> {o.brand}</span>
                <span><Icon name="video" size={14} /> {o.videos} videos</span>
                <span><Icon name="calendar" size={14} /> {o.deadline}</span>
              </div>
              <div className="quote-row total"><span>Recibirás (neto)</span><strong style={{ color: 'var(--verde)' }}>${q.creatorGets.toLocaleString()} MXN</strong></div>
              {o.status === 'en_curso' && <button className="btn btn-grad btn-block btn-sm" onClick={() => setDeliver(o)}><Icon name="upload" size={14} color="#fff" /> Entregar contenido</button>}
              {o.status === 'entregado' && <p className="hint">Entregado. Esperando revisión de la marca.</p>}
              {o.status === 'completado' && <p className="hint hint-ok"><Icon name="check" size={14} color="var(--verde)" strokeWidth={2.5} /> Pago liberado a tu CLABE.</p>}
            </div>
          )
        })}
      </div>
      <DeliverModal order={deliver} onClose={() => setDeliver(null)} onDeliver={(url) => { deliverOrder(deliver.id, url); setDeliver(null) }} />
    </>
  )
}

function DeliverModal({ order, onClose, onDeliver }) {
  const [url, setUrl] = useState('')
  const valid = /^https?:\/\/.+\..+/.test(url.trim())
  return (
    <Modal open={!!order} onClose={onClose} title="Entregar contenido"
      footer={<button className="btn btn-grad btn-sm" disabled={!valid} onClick={() => onDeliver(url.trim())}>Confirmar entrega</button>}>
      <div className="info-banner">
        Sube tus videos terminados a Google Drive, WeTransfer o Dropbox en alta definición.
        Activa permisos de lectura públicos y pega el enlace de descarga aquí.
      </div>
      <div className="field">
        <label>Enlace de descarga externo</label>
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/…" />
        {!valid && url && <p className="err">Ingresa una URL válida.</p>}
      </div>
      <p className="hint">No se permiten videos finales en el chat. La entrega se registra como "Entregado - Pendiente de Revisión".</p>
    </Modal>
  )
}

/* ---- CHAT ---- */

function Chat({ userId }) {
  const [ctx, setCtx] = useState(null)

  if (!ctx) return <ChatList userId={userId} onSelect={setCtx} />
  return <ChatConversation userId={userId} ctx={ctx} onBack={() => setCtx(null)} />
}

function ChatList({ userId, onSelect }) {
  const [chats, setChats]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !supabase) return
    supabase
      .from('chats')
      .select('id, campana_id, marca_id, campanas ( titulo, videos ), marcas ( nombre_comercial )')
      .eq('creadora_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setChats(data.map((c) => ({
          chatId:     c.id,
          campanaId:  c.campana_id,
          marcaId:    c.marca_id,
          marcaNombre: c.marcas?.nombre_comercial ?? 'Marca',
          campTitle:  c.campanas?.titulo  ?? 'Campana',
          videos:     c.campanas?.videos  ?? 1,
        })))
        setLoading(false)
      })
  }, [userId])

  if (loading) return <div className="card card-pad center"><p className="text-muted">Cargando chats...</p></div>

  if (chats.length === 0) {
    return (
      <div className="card card-pad center">
        <Icon name="chat" size={32} color="var(--solar)" />
        <p className="text-muted" style={{ marginTop: 12 }}>
          Aún no tienes chats. Cuando una marca te seleccione, podrás negociar aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="chat-list">
      {chats.map((c) => (
        <button key={c.chatId} className="chat-list-item" onClick={() => onSelect(c)}>
          <div className="dash-avatar">{c.marcaNombre.charAt(0)}</div>
          <div className="cli-info">
            <strong>{c.marcaNombre}</strong>
            <span>{c.campTitle} &middot; {c.videos} videos</span>
          </div>
          <span className="cli-arrow">→</span>
        </button>
      ))}
    </div>
  )
}

function ChatConversation({ userId, ctx, onBack }) {
  const [messages, setMessages] = useState([])
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const endRef  = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!ctx?.chatId || !supabase) return
    setMessages([])

    supabase
      .from('mensajes')
      .select('id, from_perfil_id, texto, archivo_url, created_at')
      .eq('chat_id', ctx.chatId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data) })

    const channel = supabase
      .channel('mensajes:' + ctx.chatId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes', filter: 'chat_id=eq.' + ctx.chatId },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [ctx?.chatId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendText = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const optimistic = {
      id: 'opt-' + Date.now(),
      from_perfil_id: userId,
      texto: text.trim(),
      archivo_url: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    setText('')
    await supabase.from('mensajes').insert({
      chat_id:        ctx.chatId,
      from_perfil_id: userId,
      texto:          optimistic.texto,
    })
    setSending(false)
  }

  const sendFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('El archivo no puede exceder 5 MB.'); return }
    setUploading(true)
    const path = ctx.chatId + '/' + Date.now() + '-' + file.name
    const { error: upErr } = await supabase.storage.from('chat-attachments').upload(path, file)
    if (upErr) { alert('Error al subir el archivo.'); setUploading(false); e.target.value = ''; return }
    const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(path)
    const optimistic = {
      id: 'opt-file-' + Date.now(),
      from_perfil_id: userId,
      texto: null,
      archivo_url: publicUrl,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])
    await supabase.from('mensajes').insert({
      chat_id:        ctx.chatId,
      from_perfil_id: userId,
      archivo_url:    publicUrl,
    })
    setUploading(false)
    e.target.value = ''
  }

  const fmt   = (iso) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const fname = (url) => { try { return decodeURIComponent(url.split('/').pop().replace(/^\d+-/, '')) } catch { return 'Archivo' } }

  return (
    <div className="chat-main card">
      <div className="chat-head">
        <button className="chat-back" onClick={onBack}>← Volver</button>
        <div className="dash-avatar">{ctx.marcaNombre?.charAt(0)}</div>
        <div>
          <strong>{ctx.marcaNombre}</strong>
          <div className="text-muted" style={{ fontSize: 13 }}>{ctx.campTitle}</div>
        </div>
      </div>
      <div className="chat-body">
        {messages.length === 0 && (
          <p className="text-muted" style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
            Inicia la conversación con {ctx.marcaNombre}.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={'bubble ' + (m.from_perfil_id === userId ? 'me' : 'them')}>
            {m.archivo_url && (
              <span className="bubble-file">
                <Icon name="paperclip" size={14} /> {fname(m.archivo_url)}{' '}
                <a href={m.archivo_url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline', fontSize: 12 }}>
                  Descargar
                </a>
              </span>
            )}
            {m.texto && <p>{m.texto}</p>}
            <span className="bubble-time">{fmt(m.created_at)}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="chat-input">
        <input
          ref={fileRef}
          type="file"
          style={{ display: 'none' }}
          accept="image/*,application/pdf,.doc,.docx,.txt"
          onChange={sendFile}
        />
        <button
          className="chat-attach"
          title="Adjuntar referencia (max 5MB)"
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? '…' : <Icon name="paperclip" size={18} />}
        </button>
        <input
          className="input"
          placeholder="Escribe un mensaje..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText() } }}
        />
        <button className="btn btn-primary btn-sm" onClick={sendText} disabled={sending || !text.trim()}>
          Enviar
        </button>
      </div>
      <p className="chat-note">Archivos de referencia hasta 5 MB. Prohibido subir videos finales aquí.</p>
    </div>
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
        <div className="order-done"><div className="done-check"><Icon name="check" size={28} color="var(--verde)" strokeWidth={3} /></div><h3 style={{ color: 'var(--verde)' }}>CLABE verificada</h3><p className="text-muted">Lista para recibir tus fondos netos.</p></div>
      ) : (
        <>
          <div className="field" style={{ marginTop: 16 }}>
            <label>CLABE (18 dígitos)</label>
            <input className="input" inputMode="numeric" maxLength={18} value={clabe}
              onChange={(e) => setClabe(e.target.value.replace(/\D/g, ''))} placeholder="012345678901234567" />
            {clabe && !valid && <p className="err">La CLABE debe tener exactamente 18 dígitos.</p>}
          </div>
          <button className="btn btn-grad" disabled={!valid} onClick={() => setSaved(true)}><Icon name="lock" size={14} color="#fff" /> Guardar y encriptar</button>
        </>
      )}
    </div>
  )
}
