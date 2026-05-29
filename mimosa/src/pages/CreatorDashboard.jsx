import { useState, useEffect } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import Modal from '../components/Modal.jsx'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { supabase } from '../lib/supabase.js'
import UrgentBanner from '../components/UrgentBanner.jsx'
import { MARKETPLACE, MARKET_STYLES, STATUS_MAP, quote, MIN_VIDEO_PRICE } from '../data/mock.js'

const PAGE_SIZE = 6

const NAV = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'market', label: 'Marketplace', icon: 'shop' },
  { id: 'orders', label: 'Mis órdenes', icon: 'video' },
  { id: 'finance', label: 'Verificación CLABE', icon: 'bank' },
]

export default function CreatorDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('home')
  const [status, setStatus] = useState('loading')

  // Cargar el status real desde la tabla `creadoras`.
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
      title={{ home: 'Inicio', market: 'Marketplace de campañas', orders: 'Mis órdenes', finance: 'Verificación financiera' }[tab]}
      subtitle={`Panel de creadora · ${user?.name || 'Creadora'}`}
    >
      {tab !== 'finance' && <UrgentBanner role="creator" onJumpToOrders={() => setTab('orders')} />}
      {tab === 'home' && <Home status={status} goMarket={() => setTab('market')} />}
      {tab === 'market' && <Marketplace locked={status !== 'verificado'} />}
      {tab === 'orders' && <Orders />}
      {tab === 'finance' && <Finance />}
    </DashboardShell>
  )
}

function Home({ status, goMarket }) {
  if (status === 'loading') {
    return <div className="card card-pad center"><p className="text-muted">Cargando tu perfil...</p></div>
  }

  if (status === 'rechazado') {
    return (
      <div className="card card-pad validation-card">
        <span className="badge badge-naranja"><span className="dot" /> Perfil rechazado</span>
        <h2>Tu portafolio no fue aprobado</h2>
        <p className="text-muted">
          Revisamos tu portafolio y por el momento no cumple con los requisitos de Mimosa.
          Revisa el feedback que te enviamos y actualiza tu portafolio desde <strong>Mi cuenta</strong>.
        </p>
      </div>
    )
  }

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
        <Stat label="Órdenes activas" value="1" grad="var(--grad-rosa-violeta)" />
        <Stat label="Ingresos del mes" value="$1,710" grad="var(--grad-verde-azul)" />
        <Stat label="Postulaciones" value="3" grad="var(--grad-solar-rosa)" />
        <Stat label="Calificación" value="4.9" grad="var(--grad-violeta-azul)" />
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
  const [query, setQuery] = useState('')
  const [style, setStyle] = useState('all')
  const [sort, setSort] = useState('deadline') // deadline | budget-desc | budget-asc
  const [page, setPage] = useState(1)

  if (locked) {
    return <div className="card card-pad center inline-ic"><Icon name="lock" size={18} /> <p className="text-muted" style={{margin:0}}>Tu perfil aún está en validación. No puedes aplicar a campañas todavía.</p></div>
  }

  // Filtrado por búsqueda + estilo
  const q = query.trim().toLowerCase()
  const filtered = MARKETPLACE.filter((c) => {
    if (style !== 'all' && c.style !== style) return false
    if (!q) return true
    return c.title.toLowerCase().includes(q) || c.brand.toLowerCase().includes(q)
  })

  // Ordenamiento
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'budget-desc') return b.refBudget - a.refBudget
    if (sort === 'budget-asc') return a.refBudget - b.refBudget
    return a.deadlineHours - b.deadlineHours // por fecha límite más cercana
  })

  // Paginación
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const visible = sorted.slice(start, start + PAGE_SIZE)

  // Si cambian filtros, regresa a página 1
  const onChangeFilter = (fn) => (e) => { fn(e.target.value); setPage(1) }

  return (
    <>
      <div className="market-toolbar">
        <div className="market-search">
          <Icon name="shop" size={16} />
          <input
            className="input"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Busca por marca o título de campaña…"
            aria-label="Buscar campañas"
          />
        </div>
        <div className="market-filters">
          <select className="select" value={style} onChange={onChangeFilter(setStyle)} aria-label="Filtrar por estilo">
            <option value="all">Todos los estilos</option>
            {MARKET_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select" value={sort} onChange={onChangeFilter(setSort)} aria-label="Ordenar">
            <option value="deadline">Vence antes</option>
            <option value="budget-desc">Presupuesto mayor</option>
            <option value="budget-asc">Presupuesto menor</option>
          </select>
        </div>
      </div>

      <p className="text-muted market-count">
        {filtered.length} {filtered.length === 1 ? 'campaña' : 'campañas'}
        {q && <> con "<strong>{query}</strong>"</>}
        {style !== 'all' && <> · estilo {style}</>}
      </p>

      {visible.length === 0 ? (
        <div className="card card-pad center" style={{ padding: 48 }}>
          <Icon name="shop" size={32} color="var(--muted)" />
          <h3 style={{ marginTop: 14, color: 'var(--ink)' }}>Sin resultados</h3>
          <p className="text-muted">Ajusta los filtros o la búsqueda.</p>
        </div>
      ) : (
        <div className="grid cards-grid">
          {visible.map((c) => {
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
                    <span><Icon name="video" size={14} /> {c.videos} × {c.duration}s</span>
                    <span><Icon name="bulb" size={14} /> Ref. ${c.refBudget.toLocaleString()}</span>
                  </div>
                  <button className="btn btn-grad btn-block btn-sm" style={{ marginTop: 16 }} onClick={() => setApply(c)}>Aplicar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />}

      <ApplyModal campaign={apply} onClose={() => setApply(null)} />
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
  const { orders, deliverOrder } = useStore()
  const [deliver, setDeliver] = useState(null)
  const mine = orders
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
