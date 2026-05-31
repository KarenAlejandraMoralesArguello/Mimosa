import { useState, useEffect, useCallback } from 'react'
import DashboardShell from '../components/DashboardShell.jsx'
import Modal from '../components/Modal.jsx'
import Icon from '../components/Icon.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { supabase } from '../lib/supabase.js'
import { STATUS_MAP } from '../data/mock.js'

export default function AdminDashboard() {
  const [tab, setTab] = useState('creators')
  const [pendingCount, setPendingCount] = useState(0)

  // Cargar conteo inicial de campanas pendientes para el badge del nav.
  useEffect(() => {
    if (!supabase) return
    supabase
      .from('campanas')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pendiente')
      .then(({ count }) => { if (count != null) setPendingCount(count) })
  }, [])

  const nav = [
    { id: 'creators',    label: 'Validar creadoras',    icon: 'check' },
    { id: 'campaigns',   label: 'Pre-aprobar campanas',  icon: 'megaphone', badge: pendingCount || undefined },
    { id: 'arbitration', label: 'Arbitraje',             icon: 'scale' },
    { id: 'accounts',    label: 'Cuentas',               icon: 'users' },
  ]

  return (
    <DashboardShell
      nav={nav}
      active={tab}
      onNavigate={setTab}
      accent="var(--violeta)"
      title={{
        creators:    'Validacion de creadoras',
        campaigns:   'Pre-aprobacion de campanas',
        arbitration: 'Panel de arbitraje',
        accounts:    'Cuentas registradas',
      }[tab]}
      subtitle="Panel de administracion - Mimosa Colab Club"
    >
      {tab === 'creators'    && <Creators />}
      {tab === 'campaigns'   && <CampaignReview onCountChange={setPendingCount} />}
      {tab === 'arbitration' && <Arbitration />}
      {tab === 'accounts'    && <Accounts />}
    </DashboardShell>
  )
}

/* ---- VALIDACION DE CREADORAS ---- */

function Creators() {
  const [list, setList]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [reject, setReject]     = useState(null)
  const [feedback, setFeedback] = useState('')

  const fetchPending = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('creadoras')
      .select('perfil_id, portafolio_url, status, created_at, perfiles ( nombre, email )')
      .eq('status', 'en_validacion')
      .order('created_at', { ascending: true })
    if (!error && data) setList(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchPending() }, [fetchPending])

  const aprobar = async (creadora) => {
    await supabase
      .from('creadoras')
      .update({ status: 'verificado' })
      .eq('perfil_id', creadora.perfil_id)

    // Notificar por email (no bloquea si la Edge Function no está configurada)
    supabase.functions.invoke('notificar-validacion', {
      body: { email: creadora.perfiles?.email, nombre: creadora.perfiles?.nombre, tipo: 'aprobado' },
    }).catch(() => {})

    setList((prev) => prev.filter((c) => c.perfil_id !== creadora.perfil_id))
  }

  const rechazar = async () => {
    const { data: { user: adminUser } } = await supabase.auth.getUser()

    // Vuelve a 'borrador' (no 'rechazado') para que la creadora pueda corregir
    // su portafolio y reenviar para validación nuevamente (PRD §4).
    await supabase
      .from('creadoras')
      .update({ status: 'borrador' })
      .eq('perfil_id', reject.perfil_id)

    // Guarda el feedback en la tabla dedicada
    await supabase.from('feedback_validacion').insert({
      creadora_id: reject.perfil_id,
      admin_id:    adminUser.id,
      mensaje:     feedback,
    })

    // Notificar por email con el feedback
    supabase.functions.invoke('notificar-validacion', {
      body: {
        email:    reject.perfiles?.email,
        nombre:   reject.perfiles?.nombre,
        tipo:     'rechazado',
        feedback,
      },
    }).catch(() => {})

    setList((prev) => prev.filter((c) => c.perfil_id !== reject.perfil_id))
    setReject(null)
    setFeedback('')
  }

  if (loading) {
    return <div className="card card-pad center"><p className="text-muted">Cargando...</p></div>
  }

  if (list.length === 0) {
    return (
      <div className="card card-pad center inline-ic">
        <Icon name="check" size={16} color="var(--verde)" strokeWidth={2.5} />
        <p className="text-muted" style={{ margin: 0 }}>No hay creadoras pendientes de validacion.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid cards-grid">
        {list.map((c) => (
          <div key={c.perfil_id} className="card card-pad">
            <div className="applicant-head">
              <div className="dash-avatar lg">{(c.perfiles?.nombre || '?').charAt(0)}</div>
              <div>
                <strong>{c.perfiles?.nombre || 'Sin nombre'}</strong>
                <div className="text-muted">{c.perfiles?.email}</div>
              </div>
              <span className="badge badge-solar"><span className="dot" /> En validacion</span>
            </div>
            <p className="text-muted" style={{ fontSize: 13 }}>
              Enviado: {new Date(c.created_at).toLocaleDateString('es-MX')}
            </p>
            <a className="link-azul" href={c.portafolio_url} target="_blank" rel="noreferrer">
              <Icon name="external" size={14} /> Revisar portafolio externo
            </a>
            <div className="applicant-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setReject(c); setFeedback('') }}>
                Rechazar
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ background: 'var(--verde)' }}
                onClick={() => aprobar(c)}
              >
                Aprobar
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!reject}
        onClose={() => setReject(null)}
        title={reject ? ('Feedback para ' + (reject.perfiles?.nombre || '')) : ''}
        footer={
          <button
            className="btn btn-primary btn-sm"
            disabled={!feedback.trim()}
            onClick={rechazar}
          >
            Enviar feedback y rechazar
          </button>
        }
      >
        <p className="text-muted">
          La creadora recibira este feedback y su perfil quedara en estado Rechazado.
        </p>
        <div className="field">
          <label>Feedback constructivo</label>
          <textarea
            className="textarea"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Ej. El portafolio necesita mas muestras de video vertical..."
          />
        </div>
      </Modal>
    </>
  )
}

/* ---- PRE-APROBACION DE CAMPANAS ---- */

function CampaignReview({ onCountChange }) {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail]   = useState(null)   // campana a ver en detalle
  const [reject, setReject]   = useState(null)   // campana a rechazar
  const [note, setNote]       = useState('')
  const [saving, setSaving]   = useState(false)

  const fetchPending = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('campanas')
      .select('id, titulo, brief, estilo, duracion_seg, videos, presupuesto, created_at, marcas ( nombre_comercial )')
      .eq('status', 'pendiente')
      .order('created_at', { ascending: true })
    if (!error && data) setList(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchPending() }, [fetchPending])

  // Sincroniza el badge del nav cuando la lista cambia (evita setState-during-render).
  useEffect(() => { onCountChange(list.length) }, [list, onCountChange])

  const remove = (id) => {
    setList((prev) => prev.filter((c) => c.id !== id))
  }

  const aprobar = async (campana) => {
    setSaving(true)
    const { error } = await supabase
      .from('campanas')
      .update({ status: 'activa' })
      .eq('id', campana.id)
    setSaving(false)
    if (!error) {
      remove(campana.id)
      setDetail(null)
    }
  }

  const rechazar = async () => {
    if (!reject) return
    setSaving(true)
    const { error } = await supabase
      .from('campanas')
      .update({ status: 'rechazada', admin_note: note.trim() || null })
      .eq('id', reject.id)
    setSaving(false)
    if (!error) {
      remove(reject.id)
      setReject(null)
      setNote('')
    }
  }

  if (loading) {
    return <div className="card card-pad center"><p className="text-muted">Cargando campanas...</p></div>
  }

  if (list.length === 0) {
    return (
      <div className="card card-pad center inline-ic">
        <Icon name="check" size={16} color="var(--verde)" strokeWidth={2.5} />
        <p className="text-muted" style={{ margin: 0 }}>No hay campanas pendientes de pre-aprobacion.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid cards-grid">
        {list.map((c) => (
          <div key={c.id} className="card card-pad">
            <span className="badge badge-solar"><span className="dot" /> Pendiente por revisar</span>
            <h3 style={{ marginTop: 12 }}>{c.titulo}</h3>
            <p className="text-muted" style={{ fontSize: 13 }}>
              {c.marcas?.nombre_comercial ?? 'Marca'} &middot; enviada {new Date(c.created_at).toLocaleDateString('es-MX')}
            </p>
            <div className="camp-meta" style={{ marginTop: 8 }}>
              <span><Icon name="video"   size={14} /> {c.videos} videos · {c.duracion_seg}s</span>
              <span><Icon name="palette" size={14} /> {c.estilo}</span>
              <span><Icon name="money"   size={14} /> ${Number(c.presupuesto).toLocaleString()} MXN</span>
            </div>
            <div className="applicant-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetail(c)}>Ver brief</button>
              <button
                className="btn btn-ghost btn-sm btn-warn"
                onClick={() => { setReject(c); setNote('') }}
              >
                Rechazar
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ background: 'var(--verde)' }}
                onClick={() => aprobar(c)}
                disabled={saving}
              >
                Publicar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: brief completo */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? detail.titulo : ''}
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => { setDetail(null); setReject(detail); setNote('') }}>
              Rechazar
            </button>
            <button
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--verde)' }}
              onClick={() => aprobar(detail)}
              disabled={saving}
            >
              {saving ? 'Publicando...' : 'Publicar en marketplace'}
            </button>
          </>
        }
      >
        {detail && (
          <>
            <div className="detail-meta">
              <div><span>Marca</span><strong>{detail.marcas?.nombre_comercial ?? '—'}</strong></div>
              <div><span>Videos</span><strong>{detail.videos}</strong></div>
              <div><span>Duración</span><strong>{detail.duracion_seg}s</strong></div>
              <div><span>Estilo</span><strong>{detail.estilo}</strong></div>
              <div><span>Presupuesto</span><strong>${Number(detail.presupuesto).toLocaleString()} MXN</strong></div>
              <div><span>Enviada</span><strong>{new Date(detail.created_at).toLocaleDateString('es-MX')}</strong></div>
            </div>
            <h4 className="detail-section">Briefing</h4>
            <p className="text-muted">{detail.brief || 'Sin briefing especificado.'}</p>
          </>
        )}
      </Modal>

      {/* Modal: rechazar con nota */}
      <Modal
        open={!!reject}
        onClose={() => setReject(null)}
        title={reject ? ('Rechazar campana — ' + reject.titulo) : ''}
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setReject(null)}>Cancelar</button>
            <button
              className="btn btn-grad btn-warn btn-sm"
              onClick={rechazar}
              disabled={saving}
            >
              {saving ? 'Rechazando...' : 'Confirmar rechazo'}
            </button>
          </>
        }
      >
        <div className="info-banner">
          La campana pasara a estado <strong>Rechazada</strong>. La marca podra editarla y reenviarla.
        </div>
        <div className="field">
          <label>Nota para la marca (opcional)</label>
          <textarea
            className="textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej. El brief no especifica el producto con suficiente detalle..."
          />
        </div>
      </Modal>
    </>
  )
}

/* ---- ARBITRAJE ---- */

function Arbitration() {
  const { orders, approveOrder, failOrder, refetch } = useStore()
  const [resolveTarget, setResolveTarget] = useState(null)
  const [chatTarget, setChatTarget] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [loadingChat, setLoadingChat] = useState(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  // Cargar historial de chat
  const handleOpenChat = async (order) => {
    setChatTarget(order)
    setLoadingChat(true)
    setChatMessages([])

    try {
      // 1. Buscar el chat por campana_id y creadora_id
      const { data: chatData, error: chatErr } = await supabase
        .from('chats')
        .select('id')
        .eq('campana_id', order.campana_id)
        .eq('creadora_id', order.creadora_id)
        .single()

      if (chatErr || !chatData) {
        console.warn('Chat no encontrado en la base de datos:', chatErr)
        setLoadingChat(false)
        return
      }

      // 2. Cargar los mensajes de ese chat
      const { data: messagesData, error: msgErr } = await supabase
        .from('mensajes')
        .select(`
          id,
          chat_id,
          from_perfil_id,
          texto,
          archivo_url,
          created_at,
          perfiles:from_perfil_id (
            nombre,
            rol
          )
        `)
        .eq('chat_id', chatData.id)
        .order('created_at', { ascending: true })

      if (!msgErr && messagesData) {
        setChatMessages(messagesData)
      } else {
        console.error('Error al cargar mensajes:', msgErr)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingChat(false)
    }
  }

  // Resolver disputa
  const handleResolve = async (action) => {
    if (!resolveTarget) return
    setSaving(true)
    try {
      if (action === 'approve') {
        await approveOrder(resolveTarget.id)
      } else if (action === 'fail') {
        await failOrder(resolveTarget.id, reason.trim() || 'Resolución de disputa por el Administrador')
      }
      setResolveTarget(null)
      setReason('')
      if (refetch) await refetch()
    } catch (e) {
      console.error('Error al resolver disputa:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="grid orders-grid">
        {orders.map((o) => {
          const st = STATUS_MAP[o.status]
          return (
            <div key={o.id} className="card card-pad order-card">
              <div className="order-head">
                <span className={'badge ' + st.badge}><span className="dot" /> {st.label}</span>
                {o.corrections > 0 && o.status !== 'cancelado' && (
                  <span className="badge badge-solar"><span className="dot" /> Ronda {o.corrections}/2</span>
                )}
              </div>
              <h3 style={{ marginTop: 12 }}>{o.campaign}</h3>
              <div className="order-meta">
                <span><Icon name="building" size={14} /> {o.brand}</span>
                <span><Icon name="user"     size={14} /> {o.creator}</span>
                <span><Icon name="money"    size={14} /> ${o.base.toLocaleString()}</span>
              </div>
              
              {o.deliveryUrl ? (
                <a className="link-azul" href={o.deliveryUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <Icon name="external" size={14} /> Inspeccionar entrega
                </a>
              ) : (
                <p className="hint">Sin entrega registrada aún.</p>
              )}

              {o.status === 'cancelado' && o.correctionNote && (
                <p className="hint" style={{ color: 'var(--naranja)', marginTop: 8 }}>
                  <strong>Motivo cancelación:</strong> {o.correctionNote}
                </p>
              )}

              <div className="applicant-actions" style={{ marginTop: 14 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => handleOpenChat(o)}>
                  Ver historial de chat
                </button>
                {(o.status === 'en_curso' || o.status === 'entregado') && (
                  <button className="btn btn-primary btn-sm" onClick={() => { setResolveTarget(o); setReason('') }}>
                    Resolver disputa
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: Historial de chat */}
      <Modal
        open={!!chatTarget}
        onClose={() => setChatTarget(null)}
        title={chatTarget ? `Historial de chat - ${chatTarget.campaign}` : ''}
        footer={
          <button className="btn btn-ghost btn-sm" onClick={() => setChatTarget(null)}>
            Cerrar
          </button>
        }
      >
        {loadingChat ? (
          <div className="center" style={{ padding: 24 }}><p className="text-muted">Cargando conversación...</p></div>
        ) : chatMessages.length === 0 ? (
          <div className="center" style={{ padding: 24 }}>
            <p className="text-muted">No se registran mensajes en esta colaboración aún.</p>
          </div>
        ) : (
          <div className="chat-body-admin" style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
            {chatMessages.map((m) => {
              const autor = m.perfiles?.nombre ?? 'Usuario'
              const rol = m.perfiles?.rol === 'brand' ? 'Marca' : 'Creadora'
              return (
                <div key={m.id} className="message-admin-row" style={{ marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <strong>{autor} ({rol})</strong>
                    <span>{new Date(m.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {m.texto && <p style={{ margin: '4px 0', fontSize: '14px' }}>{m.texto}</p>}
                  {m.archivo_url && (
                    <a href={m.archivo_url} target="_blank" rel="noreferrer" className="link-azul" style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="paperclip" size={12} /> Descargar archivo adjunto
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Modal>

      {/* Modal: Resolver Disputa / Escrow */}
      <Modal
        open={!!resolveTarget}
        onClose={() => setResolveTarget(null)}
        title={resolveTarget ? `Resolver Disputa - ${resolveTarget.campaign}` : ''}
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setResolveTarget(null)}>
              Cancelar
            </button>
            <button
              className="btn btn-grad btn-warn btn-sm"
              disabled={saving || !reason.trim()}
              onClick={() => handleResolve('fail')}
            >
              {saving ? 'Procesando...' : 'Reembolsar a Marca'}
            </button>
            <button
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--verde)' }}
              disabled={saving}
              onClick={() => handleResolve('approve')}
            >
              {saving ? 'Procesando...' : 'Liberar a Creadora'}
            </button>
          </>
        }
      >
        {resolveTarget && (
          <>
            <div className="info-banner" style={{ marginBottom: '16px' }}>
              <strong>Acción del Administrador:</strong> Esta herramienta te permite forzar el flujo de escrow para desbloquear una orden en disputa o estancada.
            </div>
            <div className="detail-meta" style={{ marginBottom: '16px' }}>
              <div><span>Marca</span><strong>{resolveTarget.brand}</strong></div>
              <div><span>Creadora</span><strong>{resolveTarget.creator}</strong></div>
              <div><span>Monto base</span><strong>${resolveTarget.base.toLocaleString()} MXN</strong></div>
              <div><span>Total Escrow</span><strong>${(resolveTarget.brandPays || resolveTarget.base * 1.15).toLocaleString()} MXN</strong></div>
            </div>
            
            {resolveTarget.deliveryUrl && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Entrega de la creadora:</strong><br />
                <a className="link-azul" href={resolveTarget.deliveryUrl} target="_blank" rel="noreferrer">
                  <Icon name="external" size={14} /> Inspeccionar material entregado
                </a>
              </div>
            )}

            <div className="field">
              <label>Justificación / Nota de Arbitraje (Obligatorio para reembolsar)</label>
              <textarea
                className="textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Escribe el motivo del reembolso a la marca, ej. El video entregado no cumple con el brief tras varias solicitudes, o La creadora abandonó el proyecto."
              />
            </div>
          </>
        )}
      </Modal>
    </>
  )
}

/* ---- CUENTAS (baneo, PRD 7.2) ---- */

function Accounts() {
  const [accounts, setAccounts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [search, setSearch]       = useState('')
  const [banTarget, setBanTarget] = useState(null)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('perfiles')
      .select('id, nombre, email, rol, banned, ban_reason, created_at')
      .neq('rol', 'admin')
      .order('created_at', { ascending: false })
    if (data) setAccounts(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  const q = search.trim().toLowerCase()
  const list = accounts.filter((a) => {
    if (filter === 'brand'   && a.rol !== 'brand')   return false
    if (filter === 'creator' && a.rol !== 'creator') return false
    if (filter === 'banned'  && !a.banned)           return false
    if (q && !(a.nombre + ' ' + a.email).toLowerCase().includes(q)) return false
    return true
  })

  const onBan = async (reason) => {
    await supabase
      .from('perfiles')
      .update({ banned: true, ban_reason: reason, banned_at: new Date().toISOString() })
      .eq('id', banTarget.id)
    setBanTarget(null)
    fetchAccounts()
  }

  const onUnban = async (acc) => {
    await supabase
      .from('perfiles')
      .update({ banned: false, ban_reason: null, banned_at: null })
      .eq('id', acc.id)
    fetchAccounts()
  }

  if (loading) {
    return <div className="card card-pad center"><p className="text-muted">Cargando...</p></div>
  }

  return (
    <>
      <div className="market-toolbar">
        <div className="market-search">
          <Icon name="users" size={16} />
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
          />
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

      <p className="text-muted market-count">
        {list.length} cuenta{list.length !== 1 ? 's' : ''}
      </p>

      {list.length === 0 ? (
        <div className="card card-pad center">
          <p className="text-muted">Sin cuentas que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="accounts-list">
          {list.map((a) => (
            <div key={a.id} className={'account-row' + (a.banned ? ' is-banned' : '')}>
              <div className="dash-avatar">{(a.nombre || '?').charAt(0)}</div>
              <div className="account-row-main">
                <strong>{a.nombre}</strong>
                <span className="text-muted">{a.email}</span>
              </div>
              <div className="account-row-meta">
                {a.rol === 'brand'   && <span className="badge badge-rosa"><span className="dot" /> Marca</span>}
                {a.rol === 'creator' && <span className="badge badge-solar"><span className="dot" /> Creadora</span>}
                {a.banned && (
                  <span className="badge badge-muted" style={{ color: 'var(--naranja)' }}>
                    <span className="dot" /> Suspendida
                  </span>
                )}
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
      title={'Suspender cuenta - ' + target.nombre}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-grad btn-warn btn-sm"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            Suspender cuenta
          </button>
        </>
      }
    >
      <div className="info-banner">
        <strong>PRD 7.2:</strong> al suspender, la cuenta no podra iniciar sesion. La accion es reversible.
      </div>
      <div className="field">
        <label>Motivo de la suspension</label>
        <textarea
          className="textarea"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej. intento de desviar transaccion fuera de Stripe..."
        />
      </div>
    </Modal>
  )
}
