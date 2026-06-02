import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { convocatoriasApi, solicitudesApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { StatCard, SolicitudBadge, ConvBadge } from '../../components/Badge'
import { fmt, fmtFecha } from '../../utils/helpers'

export default function EstDashboard() {
  const { user } = useAuth()
  const toast    = useToast()
  const [convs,   setConvs]   = useState([])
  const [sols,    setSols]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [cr, sr] = await Promise.all([
          convocatoriasApi.getAll({ estado: 'ABIERTA' }),
          solicitudesApi.getAll(),
        ])
        setConvs(cr.data?.items ?? cr.data ?? [])
        setSols(Array.isArray(sr.data) ? sr.data : (sr.data?.items ?? []))
      } catch { toast.error('Error al cargar dashboard') }
      finally  { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Bienvenido, {user?.nombre}</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Convocatorias abiertas" value={convs.length}
          color="blue" icon={<IconConv />} />
        <StatCard label="Solicitudes enviadas" value={sols.length}
          color="yellow" icon={<IconSol />} />
        <StatCard label="En revisión" value={sols.filter(s => s.estado === 'EN_REVISION').length}
          color="purple" icon={<IconClock />} />
        <StatCard label="Aprobadas" value={sols.filter(s => s.estado === 'APROBADO').length}
          color="green" icon={<IconCheck />} />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">
            Convocatorias abiertas
            <Link to="/convocatorias" style={{ fontSize: '.78rem', fontWeight: 400 }}>Ver todas →</Link>
          </div>
          {convs.length === 0
            ? <p style={{ color: 'var(--text3)', fontSize: '.82rem', textAlign: 'center', padding: '16px 0' }}>No hay convocatorias abiertas</p>
            : <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Convocatoria</th><th>Cierre</th><th></th></tr></thead>
                  <tbody>
                    {convs.slice(0, 3).map(c => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.nombre}</strong>
                          <span className="sub" style={{ color: 'var(--success)' }}>{fmt(c.monto)}</span>
                        </td>
                        <td>{fmtFecha(c.fechaFin)}</td>
                        <td><ConvBadge estado={c.estado} fechaFin={c.fechaFin} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>

        <div className="card">
          <div className="card-title">
            Mis solicitudes
            <Link to="/solicitudes" style={{ fontSize: '.78rem', fontWeight: 400 }}>Ver todas →</Link>
          </div>
          {sols.length === 0
            ? <p style={{ color: 'var(--text3)', fontSize: '.82rem', textAlign: 'center', padding: '16px 0' }}>Sin solicitudes enviadas</p>
            : <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Convocatoria</th><th>Estado</th></tr></thead>
                  <tbody>
                    {sols.slice(0, 3).map(s => (
                      <tr key={s.id}>
                        <td><strong>{s.convocatoria?.nombre}</strong></td>
                        <td><SolicitudBadge estado={s.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      </div>
    </div>
  )
}

function IconConv()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="14" rx="2"/></svg> }
function IconSol()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/></svg> }
function IconClock() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function IconCheck() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
