import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Icon from './Icon.jsx'

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [open, setOpen]     = useState(false)
  const ref = useRef(null)

  const unread = notifs.filter((n) => !n.leida).length

  const fetchNotifs = useCallback(async () => {
    if (!user || user === 'loading') return
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('perfil_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotifs(data)
  }, [user])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  // Realtime: nuevas notificaciones llegan sin hacer polling
  useEffect(() => {
    if (!user || user === 'loading') return
    const channel = supabase
      .channel('notif-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
        filter: `perfil_id=eq.${user.id}`,
      }, (payload) => {
        setNotifs((prev) => [payload.new, ...prev].slice(0, 20))
        // Email: invocar edge function
        supabase.functions.invoke('enviar-notificacion', {
          body: {
            email: user.email,
            nombre: user.name,
            titulo: payload.new.titulo,
            cuerpo: payload.new.cuerpo,
            link:   payload.new.link,
            tipo:   payload.new.tipo,
          },
        })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  // Cierra el dropdown al hacer click afuera
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markRead = async (notif) => {
    if (!notif.leida) {
      await supabase.from('notificaciones').update({ leida: true }).eq('id', notif.id)
      setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, leida: true } : n))
    }
    setOpen(false)
    if (notif.link) window.location.href = notif.link
  }

  const markAllRead = async () => {
    const ids = notifs.filter((n) => !n.leida).map((n) => n.id)
    if (!ids.length) return
    await supabase.from('notificaciones').update({ leida: true }).in('id', ids)
    setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })))
  }

  return (
    <div className="notif-bell" ref={ref}>
      <button
        className="notif-bell-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ''}`}
      >
        <Icon name="bell" size={20} color="currentColor" />
        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-drop-head">
            <span>Notificaciones</span>
            {unread > 0 && (
              <button className="link-btn" onClick={markAllRead}>
                Marcar todas leídas
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <p className="notif-empty">Sin notificaciones por ahora.</p>
          ) : (
            <ul className="notif-list">
              {notifs.map((n) => (
                <li
                  key={n.id}
                  className={`notif-item${n.leida ? '' : ' is-unread'}`}
                  onClick={() => markRead(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && markRead(n)}
                >
                  {!n.leida && <span className="notif-dot" aria-hidden="true" />}
                  <div className="notif-item-body">
                    <strong>{n.titulo}</strong>
                    <p>{n.cuerpo}</p>
                    <time>{new Date(n.created_at).toLocaleString('es-MX', {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}</time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
