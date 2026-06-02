export const fmt = (n) =>
  '$' + Number(n).toLocaleString('es-CO')

export const fmtFecha = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return iso }
}

export const hoy = () => new Date().toISOString().split('T')[0]

export const initials = (nombre) =>
  (nombre || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

export const estadoSolicitudLabel = {
  EN_REVISION:  { label: 'En revisión',   cls: 'badge-yellow' },
  APROBADO:     { label: 'Aprobado',      cls: 'badge-green'  },
  RECHAZADO:    { label: 'Rechazado',     cls: 'badge-red'    },
  DESEMBOLSADO: { label: 'Desembolsado',  cls: 'badge-blue'   },
}

export const estadoPagoLabel = {
  PENDIENTE:  { label: 'Pendiente',   cls: 'badge-yellow' },
  PROCESADO:  { label: 'Procesado',   cls: 'badge-blue'   },
  COMPLETADO: { label: 'Completado',  cls: 'badge-green'  },
}

export const convBadge = (c) => {
  const vencida = new Date() > new Date(c.fechaFin) && c.estado !== 'CERRADA'
  if (vencida)              return { label: 'Vencida', cls: 'badge-red',   esAbierta: false }
  if (c.estado === 'CERRADA') return { label: 'Cerrada', cls: 'badge-gray', esAbierta: false }
  return { label: 'Abierta', cls: 'badge-green', esAbierta: true }
}
