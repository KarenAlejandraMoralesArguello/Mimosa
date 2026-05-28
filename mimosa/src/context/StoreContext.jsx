import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ORDERS as SEED_ORDERS } from '../data/mock.js'

// Estado compartido del demo (órdenes y correcciones).
// En producción esto se reemplaza por queries reales a Supabase.
const StoreContext = createContext(null)

const KEY = 'mimosa_orders'
let _seq = 1000
const newId = () => `o${++_seq}`

const seed = () => SEED_ORDERS.map((o) => ({ ...o, corrections: 0 }))

function loadOrders() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : seed()
  } catch { return seed() }
}

export function StoreProvider({ children }) {
  const [orders, setOrders] = useState(loadOrders)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(orders)) } catch {}
  }, [orders])

  const addOrder = useCallback((order) => {
    const final = { id: newId(), corrections: 0, status: 'en_curso', ...order }
    setOrders((prev) => [final, ...prev])
    return final
  }, [])

  // PRD §7.1: máx 2 rondas de correcciones.
  // Si se agotan y la marca pide otra, la orden se cancela como fallida.
  const requestCorrection = useCallback((id, note) => {
    setOrders((prev) => prev.map((o) => {
      if (o.id !== id) return o
      if (o.corrections >= 2) return { ...o, status: 'cancelado', correctionNote: note || o.correctionNote }
      return { ...o, corrections: o.corrections + 1, status: 'en_curso', correctionNote: note }
    }))
  }, [])

  const approveOrder = useCallback((id) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'completado' } : o))
  }, [])

  const deliverOrder = useCallback((id, url) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'entregado', deliveryUrl: url } : o))
  }, [])

  const failOrder = useCallback((id, reason) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'cancelado', correctionNote: reason || o.correctionNote } : o))
  }, [])

  const resetDemo = useCallback(() => {
    localStorage.removeItem(KEY)
    setOrders(seed())
  }, [])

  return (
    <StoreContext.Provider value={{ orders, addOrder, requestCorrection, approveOrder, deliverOrder, failOrder, resetDemo }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
