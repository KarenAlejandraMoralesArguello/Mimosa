import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import Modal from '../components/Modal.jsx'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { supabase } from '../lib/supabase.js'
import UrgentBanner from '../components/UrgentBanner.jsx'
import { STATUS_MAP, quote, MIN_VIDEO_PRICE } from '../data/mock.js'
import { sendEmail } from '../lib/email.js'

const PLAN_LIMITS = { foru: 3, starter: 6, pro: 12 }

export default function BrandDashboard() {
  const { user } = useAuth()
  const params   = useMemo(() => new URLSearchParams(window.location.search), [])
  const [tab, setTab]               = useState(() => params.get('orden') === 'pagada' ? 'orders' : 'campaigns')
  const [ordenBanner, setOrdenBanner] = useState(params.get('orden') === 'pagada')
  const [brandName, setBrandName]   = useState('')
  const [plan, setPlan]             = useState('starter')
  const [initialChatCtx, setInitialChatCtx] = useState(null)
  const [applicantsCount, setApplicantsCount] = useState(0)

  // Limpiar el query param sin recargar la página
  useEffect(() => {
    if (params.get('orden') === 'pagada') {
      window.history.replaceState({}, '', '/marca')
      setTimeout(() => setOrdenBanner(false), 5000)
    }
  }, [params])

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

  // Conteo real de postulaciones para badge del nav
  // postulaciones no tiene marca_id directo → join por campanas
  useEffect(() => {
    if (!user || !supabase) return
    supabase
      .from('campanas')
      .select('id')
      .eq('marca_id', user.id)
      .then(async ({ data: camps }) => {
        const ids = (camps ?? []).map((c) => c.id)
        if (ids.length === 0) { setApplicantsCount(0); return }
        const { count } = await supabase
          .from('postulaciones')
          .select('id', { count: 'exact', head: true })
          .in('campana_id', ids)
        if (count != null) setApplicantsCount(count)
      })
  }, [user])

  const nav = [
    { id: 'campaigns',  label: 'Campanas',      icon: 'megaphone' },
    { id: 'applicants', label: 'Postulantes',    icon: 'users', badge: applicantsCount || undefined },
    { id: 'chat',       label: 'Chat',           icon: 'chat' },
    { id: 'orders',     label: 'Ordenes Escrow', icon: 'shield' },
  ]

  return (
    <DashboardShell
      nav={nav}
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
      {ordenBanner && (
        <div className="info-banner" style={{ background: 'var(--verde)', color: '#fff', marginBottom: 16 }}>
          <strong>¡Pago recibido!</strong> Tu orden está activa y los fondos quedaron en escrow. La creadora verá la orden en su panel.
        </div>
      )}
      {tab !== 'chat' && <UrgentBanner role="brand" onJumpToOrders={() => setTab('orders')} />}
      {tab === 'campaigns'  && <Campaigns brandId={user?.id} plan={plan} onOpenApplicants={() => setTab('applicants')} />}
      {tab === 'applicants' && (
        <Applicants
          brandId={user?.id}
          onStartChat={(ctx) => { setInitialChatCtx(ctx); setTab('chat') }}
        />
      )}
      {tab === 'chat' && (
        <Chat
          userId={user?.id}
          initialCtx={initialChatCtx}
          onCreated={() => setTab('orders')}
        />
      )}
      {tab === 'orders' && <Orders />}
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

  const limit   = PLAN_LIMITS[plan] ?? 6
  const activas = campaigns.filter((c) => c.status === 'activa').length

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
        status:      'pendiente',
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

/* ---- POSTULANTES ---- */

function Applicants({ brandId, onStartChat }) {
  const [campaigns, setCampaigns]   = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loadingC, setLoadingC]     = useState(true)
  const [loadingA, setLoadingA]     = useState(false)
  const [portfolio, setPortfolio]   = useState(null)
  const [startingChat, setStartingChat] = useState(false)

  useEffect(() => {
    if (!brandId || !supabase) return
    setLoadingC(true)
    supabase
      .from('campanas')
      .select('id, titulo, videos, presupuesto')
      .eq('marca_id', brandId)
      .in('status', ['activa', 'pendiente', 'cerrada'])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setCampaigns(data)
          if (data.length > 0) setSelectedId(data[0].id)
        }
        setLoadingC(false)
      })
  }, [brandId])

  useEffect(() => {
    if (!selectedId || !supabase) return
    setLoadingA(true)
    supabase
      .from('postulaciones')
      .select('id, propuesta, precio_video, created_at, creadoras ( perfil_id, portafolio_url, status, perfiles ( nombre ) )')
      .eq('campana_id', selectedId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setApplicants(data)
        setLoadingA(false)
      })
  }, [selectedId])

  const selectedCamp = campaigns.find((c) => c.id === selectedId)

  const handleStartChat = async (a) => {
    if (!supabase || !brandId || !selectedId || startingChat) return
    setStartingChat(true)
    const creadoId    = a.creadoras?.perfil_id
    const creadoNombre = a.creadoras?.perfiles?.nombre ?? 'Creadora'

    const { data, error } = await supabase
      .from('chats')
      .upsert(
        { campana_id: selectedId, marca_id: brandId, creadora_id: creadoId },
        { onConflict: 'campana_id,creadora_id' }
      )
      .select('id')
      .single()

    setStartingChat(false)
    if (error || !data) { console.error('chat upsert:', error); return }

    onStartChat({
      chatId:      data.id,
      campanaId:   selectedId,
      creadoId,
      creadoNombre,
      campTitle:   selectedCamp?.titulo    ?? 'Campana',
      videos:      selectedCamp?.videos    ?? 1,
      presupuesto: selectedCamp?.presupuesto ?? 0,
    })
  }

  if (loadingC) {
    return <div className="card card-pad center"><p className="text-muted">Cargando...</p></div>
  }

  if (campaigns.length === 0) {
    return (
      <div className="card card-pad center">
        <p className="text-muted">
          No tienes campanas activas aun. Crea una campana para empezar a recibir postulaciones.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="toolbar">
        <div className="field" style={{ margin: 0, minWidth: 260 }}>
          <select
            className="select"
            value={selectedId ?? ''}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.titulo}</option>
            ))}
          </select>
        </div>
        <p className="text-muted">
          {loadingA ? 'Cargando...' : (applicants.length + ' postulante' + (applicants.length !== 1 ? 's' : ''))}
        </p>
      </div>

      {loadingA ? (
        <div className="card card-pad center"><p className="text-muted">Cargando postulantes...</p></div>
      ) : applicants.length === 0 ? (
        <div className="card card-pad center">
          <Icon name="users" size={32} color="var(--rosa)" />
          <p className="text-muted" style={{ marginTop: 12 }}>
            Aun no hay postulaciones para esta campana.
          </p>
        </div>
      ) : (
        <div className="grid cards-grid">
          {applicants.map((a) => {
            const nombre    = a.creadoras?.perfiles?.nombre ?? 'Creadora'
            const portUrl   = a.creadoras?.portafolio_url
            const verified  = a.creadoras?.status === 'verificado'
            const q         = quote(a.precio_video * (selectedCamp?.videos ?? 1))
            return (
              <div key={a.id} className="card card-pad applicant-card">
                <div className="applicant-head">
                  <div className="dash-avatar lg">{nombre.charAt(0)}</div>
                  <div>
                    <strong>{nombre}</strong>
                    <div className="text-muted" style={{ fontSize: 13 }}>
                      ${a.precio_video} MXN/video
                    </div>
                  </div>
                  {verified
                    ? <span className="badge badge-verde"><span className="dot" /> Verificada</span>
                    : <span className="badge badge-solar"><span className="dot" /> Pendiente</span>}
                </div>
                {a.propuesta && (
                  <p className="applicant-proposal">"{a.propuesta}"</p>
                )}
                <div className="applicant-price">
                  <span>Por video: <strong>${a.precio_video} MXN</strong></span>
                  <span className="text-muted">Total marca aprox. ${q.brandPays.toLocaleString()}</span>
                </div>
                <div className="applicant-actions">
                  {portUrl && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setPortfolio({ nombre, url: portUrl })}
                    >
                      Ver portafolio
                    </button>
                  )}
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleStartChat(a)}
                    disabled={startingChat}
                  >
                    {startingChat ? 'Abriendo...' : 'Iniciar chat'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={!!portfolio}
        onClose={() => setPortfolio(null)}
        title={portfolio ? ('Portafolio - ' + portfolio.nombre) : ''}
        footer={
          <a className="btn btn-grad btn-sm" href={portfolio?.url} target="_blank" rel="noreferrer">
            Abrir en nueva pestana
          </a>
        }
      >
        {portfolio && (
          <div className="portfolio-modal">
            <div className="portfolio-frame">
              <Icon name="video" size={42} color="var(--violeta)" />
              <p>Vista previa del portafolio externo</p>
              <code>{portfolio.url}</code>
            </div>
            <p className="text-muted">El portafolio se abre en un modal para no perder tu flujo de revision.</p>
          </div>
        )}
      </Modal>
    </>
  )
}

/* ---- CHAT ---- */

function Chat({ userId, initialCtx, onCreated }) {
  const [ctx, setCtx] = useState(null)

  useEffect(() => {
    if (initialCtx) setCtx(initialCtx)
  }, [initialCtx])

  if (!ctx) return <ChatList userId={userId} onSelect={setCtx} />
  return (
    <ChatConversation
      userId={userId}
      ctx={ctx}
      onBack={() => setCtx(null)}
      onCreated={onCreated}
      isBrand
    />
  )
}

function ChatList({ userId, onSelect }) {
  const [chats, setChats]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !supabase) return
    supabase
      .from('chats')
      .select('id, campana_id, creadora_id, campanas ( titulo, videos, presupuesto ), creadoras ( perfiles ( nombre ) )')
      .eq('marca_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setChats(data.map((c) => ({
          chatId:      c.id,
          campanaId:   c.campana_id,
          creadoId:    c.creadora_id,
          creadoNombre: c.creadoras?.perfiles?.nombre ?? 'Creadora',
          campTitle:   c.campanas?.titulo    ?? 'Campana',
          videos:      c.campanas?.videos    ?? 1,
          presupuesto: c.campanas?.presupuesto ?? 0,
        })))
        setLoading(false)
      })
  }, [userId])

  if (loading) return <div className="card card-pad center"><p className="text-muted">Cargando chats...</p></div>

  if (chats.length === 0) {
    return (
      <div className="card card-pad center">
        <Icon name="chat" size={32} color="var(--rosa)" />
        <p className="text-muted" style={{ marginTop: 12 }}>
          Aun no tienes chats abiertos. Ve a <strong>Postulantes</strong> y haz clic en "Iniciar chat" para comenzar a negociar con una creadora.
        </p>
      </div>
    )
  }

  return (
    <div className="chat-list">
      {chats.map((c) => (
        <button key={c.chatId} className="chat-list-item" onClick={() => onSelect(c)}>
          <div className="dash-avatar">{c.creadoNombre.charAt(0)}</div>
          <div className="cli-info">
            <strong>{c.creadoNombre}</strong>
            <span>{c.campTitle} &middot; {c.videos} videos</span>
          </div>
          <span className="cli-arrow">→</span>
        </button>
      ))}
    </div>
  )
}

function ChatConversation({ userId, ctx, onBack, onCreated, isBrand }) {
  const { user }                    = useAuth()
  const [messages, setMessages]     = useState([])
  const [text, setText]             = useState('')
  const [sending, setSending]       = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [orderOpen, setOrderOpen]   = useState(false)
  const [recipient, setRecipient]   = useState(null)
  const endRef  = useRef(null)
  const fileRef = useRef(null)

  // Precargar email del destinatario para notificaciones
  useEffect(() => {
    if (!ctx?.chatId || !supabase) return
    supabase.from('chats').select('marca_id, creadora_id').eq('id', ctx.chatId).single()
      .then(async ({ data: chat }) => {
        if (!chat) return
        const otherId = userId === chat.marca_id ? chat.creadora_id : chat.marca_id
        if (!otherId) return
        const { data: p } = await supabase.from('perfiles').select('email, nombre').eq('id', otherId).single()
        if (p) setRecipient({ email: p.email, nombre: p.nombre, rol: userId === chat.marca_id ? 'creadora' : 'brand' })
      })
  }, [ctx?.chatId, userId])

  // Cargar mensajes e iniciar suscripcion Realtime
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

  // Auto-scroll al ultimo mensaje
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
    const { data: inserted } = await supabase.from('mensajes').insert({
      chat_id:        ctx.chatId,
      from_perfil_id: userId,
      texto:          optimistic.texto,
    }).select('id').single()
    if (inserted?.id) {
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...m, id: inserted.id } : m))
    }
    if (recipient?.email) {
      sendEmail('nuevo_mensaje', recipient.email, {
        nombre:    recipient.nombre ?? '',
        remitente: user?.name ?? 'Mimosa',
        campana:   ctx.campTitle ?? 'tu colaboración',
        rol:       recipient.rol,
      })
    }
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
    const { data: insertedFile } = await supabase.from('mensajes').insert({
      chat_id:        ctx.chatId,
      from_perfil_id: userId,
      archivo_url:    publicUrl,
    }).select('id').single()
    if (insertedFile?.id) {
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? { ...m, id: insertedFile.id } : m))
    }
    setUploading(false)
    e.target.value = ''
  }

  const fmt  = (iso) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const fname = (url) => { try { return decodeURIComponent(url.split('/').pop().replace(/^\d+-/, '')) } catch { return 'Archivo' } }

  const otherName = isBrand ? ctx.creadoNombre : ctx.marcaNombre

  const conversation = (
    <div className="chat-main card">
      <div className="chat-head">
        <button className="chat-back" onClick={onBack}>← Volver</button>
        <div className="dash-avatar">{otherName?.charAt(0)}</div>
        <div>
          <strong>{otherName}</strong>
          <div className="text-muted" style={{ fontSize: 13 }}>{ctx.campTitle}</div>
        </div>
      </div>
      <div className="chat-body">
        {messages.length === 0 && (
          <p className="text-muted" style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
            Inicia la negociacion con {otherName}.
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
      <p className="chat-note">Archivos de referencia hasta 5 MB. Prohibido subir videos finales aqui.</p>
    </div>
  )

  if (!isBrand) return conversation

  return (
    <div className="chat-layout">
      {conversation}
      <aside className="chat-side card card-pad">
        <h3>Resumen de la colaboracion</h3>
        <ul className="chat-summary">
          <li><span>Campana</span><strong>{ctx.campTitle}</strong></li>
          <li><span>Creadora</span><strong>{ctx.creadoNombre}</strong></li>
          <li><span>Videos</span><strong>{ctx.videos} videos</strong></li>
          <li><span>Presupuesto ref.</span><strong>${Number(ctx.presupuesto).toLocaleString()} MXN</strong></li>
        </ul>
        <button className="btn btn-grad btn-block" onClick={() => setOrderOpen(true)}>
          <Icon name="shield" size={16} color="#fff" /> Crear orden
        </button>
        <p className="hint">Al crear la orden se genera el pago en escrow via Stripe.</p>
      </aside>
      <CreateOrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        onCreated={onCreated}
        campanaId={ctx.campanaId}
        creadoId={ctx.creadoId}
        defaultVideos={ctx.videos}
        defaultBase={Number(ctx.presupuesto)}
      />
    </div>
  )
}

function CreateOrderModal({ open, onClose, onCreated, campanaId, creadoId, defaultVideos = 3, defaultBase = 1500 }) {
  const { user }                    = useAuth()
  const [base, setBase]             = useState(defaultBase)
  const [videos, setVideos]         = useState(defaultVideos)
  const [deadline, setDeadline]     = useState('2026-06-15')
  const [loading, setLoading]       = useState(false)
  const [err, setErr]               = useState('')
  const q      = quote(base || 0)
  const tooLow = base < MIN_VIDEO_PRICE

  const reset = () => { setBase(defaultBase); setVideos(defaultVideos); setErr(''); onClose() }

  const pay = async () => {
    if (!user) return
    setLoading(true)
    setErr('')
    const { data, error } = await supabase.functions.invoke('pagar-orden', {
      body: {
        videos,
        base,
        deadline,
        campana_id:   campanaId   ?? null,
        creadora_id:  creadoId    ?? null,
        marca_id:     user.id,
        email_marca:  user.email,
        nombre_marca: user.name,
      },
    })
    setLoading(false)
    if (error || !data?.url) {
      setErr('No se pudo iniciar el pago. Intenta de nuevo.')
      return
    }
    window.location.href = data.url
  }

  return (
    <Modal
      open={open}
      onClose={reset}
      title="Crear orden"
      footer={
        <button className="btn btn-grad btn-sm" disabled={tooLow || loading} onClick={pay}>
          {loading ? 'Generando pago…' : `Pagar $${q.brandPays.toLocaleString()} MXN`}
        </button>
      }
    >
      <div className="grid-2">
        <div className="field">
          <label>Cantidad de videos</label>
          <input className="input" type="number" min={1} value={videos} onChange={(e) => setVideos(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Fecha límite</label>
          <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Precio base totalizado (MXN)</label>
        <input className="input" type="number" value={base} onChange={(e) => setBase(Number(e.target.value))} />
        {tooLow && <p className="err">El acuerdo no puede ser menor a ${MIN_VIDEO_PRICE} MXN por video (PRD 5.2).</p>}
      </div>
      <QuoteBox q={q} />
      <p className="hint">Al continuar serás redirigido a Stripe. El capital queda congelado en escrow hasta que apruebes el contenido.</p>
      {err && <p className="err" style={{ marginTop: 8 }}>{err}</p>}
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
