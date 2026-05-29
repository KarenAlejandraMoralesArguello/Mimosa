import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'

// Contexto de órdenes — conectado a Supabase.
// Expone el mismo shape que usaba el demo (orders, addOrder, etc.)
// para que los dashboards no necesiten cambios.
const StoreContext = createContext(null)

// ─── Helpers ───────────────────────────────────────────────

// Calcula las horas restantes hasta el deadline (puede ser negativo si venció).
function horasRestantes(deadline) {
  if (!deadline) return null
  const diff = new Date(deadline) - new Date()
  return Math.round(diff / 1000 / 3600)
}

// Mapea una fila de `ordenes` (DB) al shape que usan los dashboards.
function mapOrden(row, perfiles = {}) {
  return {
    id:             row.id,
    campaign:       row.campanas?.titulo   ?? row.campana_id,
    brand:          perfiles[row.marca_id]    ?? row.marca_id,
    creator:        perfiles[row.creadora_id] ?? row.creadora_id,
    marca_id:       row.marca_id,
    creadora_id:    row.creadora_id,
    videos:         row.videos,
    base:           Number(row.base_mxn),
    brandPays:      Number(row.brand_pays),
    creatorGets:    Number(row.creator_gets),
    status:         row.status,
    deadline:       row.deadline,
    deadlineHours:  horasRestantes(row.deadline),
    corrections:    row.corrections_used ?? 0,
    correctionNote: row.correction_note  ?? '',
    deliveryUrl:    row.delivery_url     ?? null,
    stripePaymentIntent: row.stripe_payment_intent ?? null,
  }
}

// ─── Provider ───────────────────────────────────────────────

export function StoreProvider({ children }) {
  const { user } = useAuth()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  // Carga órdenes según el rol del usuario.
  const fetchOrders = useCallback(async () => {
    if (!user || user === 'loading') { setOrders([]); setLoading(false); return }

    setLoading(true)

    // 1. Construir query base con join a campanas para obtener el título.
    let query = supabase
      .from('ordenes')
      .select('*, campanas ( titulo )')
      .order('created_at', { ascending: false })

    if (user.role === 'brand')   query = query.eq('marca_id',    user.id)
    if (user.role === 'creator') query = query.eq('creadora_id', user.id)
    // admin: sin filtro → lee todas

    const { data: rows, error } = await query

    if (error || !rows) { setLoading(false); return }

    // 2. Obtener nombres de perfiles involucrados para mostrar en UI.
    const ids = [...new Set(rows.flatMap((r) => [r.marca_id, r.creadora_id]))]
    const { data: perfilesData } = await supabase
      .from('perfiles')
      .select('id, nombre')
      .in('id', ids)

    const perfilesMap = Object.fromEntries((perfilesData || []).map((p) => [p.id, p.nombre]))

    setOrders(rows.map((r) => mapOrden(r, perfilesMap)))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ─── Mutaciones ────────────────────────────────────────────

  // Crear orden. En Fase 3 esto pasará por una Edge Function + Stripe.
  // Por ahora inserta directamente con status 'en_curso'.
  const addOrder = useCallback(async (order) => {
    if (!user) return null

    const base    = Number(order.base)
    const payload = {
      campana_id:   order.campana_id  ?? null,
      marca_id:     user.role === 'brand' ? user.id : order.marca_id,
      creadora_id:  order.creadora_id ?? null,
      videos:       order.videos,
      base_mxn:     base,
      brand_pays:   Math.round(base * 1.15 * 100) / 100,
      creator_gets: Math.round(base * 0.95 * 100) / 100,
      status:       'en_curso',
      deadline:     order.deadline ?? null,
    }

    const { data, error } = await supabase
      .from('ordenes')
      .insert(payload)
      .select('*, campanas ( titulo )')
      .single()

    if (error || !data) { console.error('addOrder:', error); return null }

    const mapped = mapOrden(data, { [user.id]: user.name })
    setOrders((prev) => [mapped, ...prev])
    return mapped
  }, [user])

  // Solicitar corrección (máx 2 por PRD §7.1).
  const requestCorrection = useCallback(async (id, note) => {
    const order = orders.find((o) => o.id === id)
    if (!order) return

    const newCorrections = order.corrections + 1
    const willFail       = newCorrections > 2
    const newStatus      = willFail ? 'cancelado' : 'en_curso'
    const finalRound     = Math.min(newCorrections, 2)

    const { error } = await supabase
      .from('ordenes')
      .update({
        status:          newStatus,
        corrections_used: willFail ? order.corrections : newCorrections,
        correction_note: note,
      })
      .eq('id', id)

    if (error) { console.error('requestCorrection:', error); return }

    // Registrar fila en `correcciones` si no se cancela.
    if (!willFail) {
      await supabase.from('correcciones').insert({
        orden_id:   id,
        ronda:      finalRound,
        comentario: note,
      })
    }

    setOrders((prev) => prev.map((o) => o.id !== id ? o : {
      ...o,
      status:      newStatus,
      corrections: willFail ? o.corrections : newCorrections,
      correctionNote: note,
    }))
  }, [orders])

  // Marca aprueba y libera el escrow. En Fase 3: llamar Edge Function de Stripe transfer.
  const approveOrder = useCallback(async (id) => {
    const { error } = await supabase
      .from('ordenes')
      .update({ status: 'completado' })
      .eq('id', id)

    if (error) { console.error('approveOrder:', error); return }
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'completado' } : o))
  }, [])

  // Creadora entrega contenido (URL externa).
  const deliverOrder = useCallback(async (id, url) => {
    const { error } = await supabase
      .from('ordenes')
      .update({ status: 'entregado', delivery_url: url })
      .eq('id', id)

    if (error) { console.error('deliverOrder:', error); return }
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'entregado', deliveryUrl: url } : o))
  }, [])

  // Marcar como fallida / cancelada.
  const failOrder = useCallback(async (id, reason) => {
    const { error } = await supabase
      .from('ordenes')
      .update({ status: 'cancelado', correction_note: reason })
      .eq('id', id)

    if (error) { console.error('failOrder:', error); return }
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'cancelado', correctionNote: reason } : o))
  }, [])

  return (
    <StoreContext.Provider value={{
      orders,
      loading,
      addOrder,
      requestCorrection,
      approveOrder,
      deliverOrder,
      failOrder,
      refetch: fetchOrders,
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
