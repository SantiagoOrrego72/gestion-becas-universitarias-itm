import { estadoSolicitudLabel, estadoPagoLabel, convBadge } from '../utils/helpers'

export function SolicitudBadge({ estado }) {
  const { label, cls } = estadoSolicitudLabel[estado] || { label: estado, cls: 'badge-gray' }
  return <span className={`badge ${cls}`}>{label}</span>
}

export function PagoBadge({ estado }) {
  const { label, cls } = estadoPagoLabel[estado] || { label: estado, cls: 'badge-gray' }
  return <span className={`badge ${cls}`}>{label}</span>
}

export function ConvBadge({ estado, fechaFin }) {
  const { label, cls } = convBadge({ estado, fechaFin })
  return <span className={`badge ${cls}`}>{label}</span>
}

export function StatCard({ label, value, color = 'blue', icon }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="stat-val">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
