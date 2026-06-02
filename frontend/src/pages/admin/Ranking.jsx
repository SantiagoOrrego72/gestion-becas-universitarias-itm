import { useEffect, useState } from 'react'
import { solicitudesApi, convocatoriasApi } from '../../api'
import { useToast } from '../../context/ToastContext'
import { SolicitudBadge } from '../../components/Badge'

export default function AdminRanking() {
  const toast = useToast()
  const [sols,     setSols]     = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  async function load() {
    try {
      const r = await solicitudesApi.getAll()
      const list = Array.isArray(r.data) ? r.data : (r.data?.items ?? [])
      const eval_  = list.filter(s => s.evaluacion).sort((a, b) => b.evaluacion.puntaje - a.evaluacion.puntaje)
      const noEval = list.filter(s => !s.evaluacion)
      setSols([...eval_, ...noEval])
      setSelected(new Set(list.filter(s => s.estado === 'APROBADO').map(s => s.id)))
    } catch { toast.error('Error al cargar ranking') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function toggle(id, disabled) {
    if (disabled) return
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function confirmar() {
    const ids = [...selected]
    if (!ids.length) { toast.error('Selecciona al menos un beneficiario evaluado'); return }
    setSaving(true)
    try {
      const r = await convocatoriasApi.confirmarBenef(ids)
      toast.success(`${r.data?.confirmados ?? ids.length} beneficiarios confirmados y notificados`)
      load()
    } catch (err) { toast.error(err.message || 'Error al confirmar') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  const MEDALLAS = ['medal-1', 'medal-2', 'medal-3']

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div><h1>Ranking de solicitudes</h1><p>Selecciona los beneficiarios y confirma</p></div>
        <button className="btn btn-primary" id="btn-confirmar-benef" onClick={confirmar} disabled={saving || !selected.size}>
          {saving ? 'Confirmando...' : `Confirmar ${selected.size} beneficiario(s)`}
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>#</th><th>Estudiante</th><th>Convocatoria</th><th>Puntaje</th><th>Estado</th><th style={{ textAlign: 'center' }}>Seleccionar</th></tr></thead>
            <tbody id="ranking-table">
              {sols.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>Sin solicitudes</td></tr>
                : sols.map((s, i) => {
                    const sinEval   = !s.evaluacion
                    const rechazado = s.estado === 'RECHAZADO'
                    const disabled  = sinEval || rechazado
                    return (
                      <tr key={s.id} className="rank-row" style={disabled ? { opacity: .5 } : {}}>
                        <td>
                          <div className={`rank-medal ${i < 3 ? MEDALLAS[i] : ''}`}
                            style={i >= 3 ? { background: 'var(--bg)', color: 'var(--text3)' } : {}}>
                            {i + 1}
                          </div>
                        </td>
                        <td>
                          <strong>{s.estudiante?.usuario?.nombre || '—'}</strong>
                          <small>{s.estudiante?.usuario?.correo || ''}</small>
                        </td>
                        <td>{s.convocatoria?.nombre || '—'}</td>
                        <td>
                          {s.evaluacion
                            ? <span style={{ fontWeight: 700, fontSize: '1.1rem', color: s.evaluacion.puntaje >= 60 ? 'var(--success)' : 'var(--danger)' }}>{s.evaluacion.puntaje}</span>
                            : <span style={{ color: 'var(--text3)' }}>—</span>
                          }
                        </td>
                        <td><SolicitudBadge estado={s.estado} /></td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" id={`rank-sel-${s.id}`} data-sol={s.id}
                            style={{ width: 18, height: 18, cursor: disabled ? 'not-allowed' : 'pointer' }}
                            checked={selected.has(s.id)} disabled={disabled}
                            onChange={() => toggle(s.id, disabled)} />
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
