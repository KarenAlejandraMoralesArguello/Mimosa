import Icon from './Icon.jsx'
import { useStore } from '../context/StoreContext.jsx'

// Banner naranja que aparece arriba del dashboard cuando hay órdenes
// con menos de 24h restantes para entrega/revisión.
// Se oculta solo si no hay órdenes urgentes.
export default function UrgentBanner({ role, onJumpToOrders }) {
  const { orders } = useStore()
  const urgent = orders.filter((o) => {
    if (o.deadlineHours == null) return false
    if (o.deadlineHours >= 24) return false
    if (o.deadlineHours <= 0) return false
    return o.status === 'en_curso' || o.status === 'entregado'
  })
  if (urgent.length === 0) return null

  const min = Math.min(...urgent.map((o) => o.deadlineHours))
  const isOne = urgent.length === 1
  const noun = isOne ? 'orden' : 'órdenes'
  const verb = role === 'creator'
    ? (isOne ? 'tienes que entregar' : 'tienes que entregar')
    : (isOne ? 'está por vencer' : 'están por vencer')
  const close = isOne ? 'Vence' : 'La más próxima vence'

  return (
    <div className="urgent-banner" role="alert">
      <div className="urgent-icon"><Icon name="clock" size={20} color="#fff" strokeWidth={2.2} /></div>
      <div className="urgent-text">
        <strong>{urgent.length} {noun} {verb} en menos de 24h.</strong>
        <span>{close} en {min}h.</span>
      </div>
      {onJumpToOrders && (
        <button className="btn btn-light btn-sm" onClick={onJumpToOrders}>Ver órdenes</button>
      )}
    </div>
  )
}
