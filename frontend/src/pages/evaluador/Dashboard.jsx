import { useEffect, useState } from 'react'
import { solicitudesApi, evaluacionesApi, documentosApi } from '../../api'
import { useToast } from '../../context/ToastContext'
import { StatCard, SolicitudBadge } from '../../components/Badge'
import Modal from '../../components/Modal'
import { fmtFecha } from '../../utils/helpers'

export default function EvalDashboard() {
  const toast = useToast()
  const [sols,    setSols]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [sel,     setSel]     = useState(null)
  const [puntaje, setPuntaje] = useState('')
  const [obs,     setObs]     = useState('')
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)

  async function load() {
    try { const r = await solicitudesApi.getAll(); setSols(Array.isArray(r.data) ? r.data : (r.data?.items ?? [])) }
    catch { toast.error('Error al cargar solicitudes') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function openModal(sol) {
    setSel(sol); setPuntaje(sol.evaluacion?.puntaje ?? ''); setObs(sol.evaluacion?.observacion ?? ''); setErrors({}); setModal(true)
  }

  async function guardar(accion) {
    const p = parseInt(puntaje)
    const e = {}
    if (isNaN(p) || p < 0 || p > 100) e.puntaje = 'El puntaje debe estar entre 0 y 100.'
    if (!obs || obs.trim().length < 10) e.obs = 'La observación debe tener al menos 10 caracteres.'
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      await evaluacionesApi.evaluar(sel.id, { puntaje: p, observacion: obs.trim(), accion })
      setModal(false)
      toast.success(`Evaluación guardada. Estado: ${accion === 'rechazar' ? 'Rechazado' : (p >= 60 ? 'Aprobado' : 'Rechazado')}`)
      load()
    } catch (err) { toast.error(err.message || 'Error al guardar evaluación') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header"><h1>Panel de Evaluador</h1></div>

      <div className="stats-grid">
        <StatCard label="Total solicitudes" value={sols.length}                            color="blue"   icon={<IconFile />} />
        <StatCard label="Pendientes"        value={sols.filter(s => !s.evaluacion).length} color="yellow" icon={<IconClock />} />
        <StatCard label="Aprobadas"         value={sols.filter(s => s.estado === 'APROBADO').length} color="green" icon={<IconCheck />} />
        <StatCard label="Rechazadas"        value={sols.filter(s => s.estado === 'RECHAZADO').length} color="red" icon={<IconX />} />
      </div>

      <div className="card">
        <div className="card-title">Solicitudes</div>
        <TablaEval sols={sols} onEval={openModal} />
      </div>

      <ModalEval open={modal} onClose={() => setModal(false)} sel={sel}
        puntaje={puntaje} setPuntaje={setPuntaje} obs={obs} setObs={setObs}
        errors={errors} saving={saving} onGuardar={guardar} />
    </div>
  )
}

export function TablaEval({ sols, onEval }) {
  return (
    <div className="table-wrap">
      <table className="table" id="eval-table-dash">
        <thead><tr><th>Estudiante</th><th>Convocatoria</th><th>Fecha envío</th><th>Puntaje</th><th>Estado</th><th>Acción</th></tr></thead>
        <tbody>
          {sols.length === 0
            ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>No hay solicitudes</td></tr>
            : sols.map(s => (
              <tr key={s.id}>
                <td>
                  <strong>{s.estudiante?.usuario?.nombre || '—'}</strong>
                  <small>{s.estudiante?.usuario?.correo || ''}</small>
                </td>
                <td>
                  <strong>{s.convocatoria?.nombre || '—'}</strong>
                  {(s.convocatoria?.documentosRequeridos || []).length > 0 && (
                    <small>Docs req: {(s.convocatoria.documentosRequeridos || []).join(', ')}</small>
                  )}
                  {(s.documentos || []).length > 0 && (
                    <small>Adjuntos: {s.documentos.map(d => d.nombre || d.tipo).join(', ')}</small>
                  )}
                </td>
                <td>{fmtFecha(s.fechaEnvio)}</td>
                <td>
                  {s.evaluacion
                    ? <span style={{ fontWeight: 600, color: s.evaluacion.puntaje >= 60 ? 'var(--success)' : 'var(--danger)' }}>{s.evaluacion.puntaje}/100</span>
                    : <span style={{ color: 'var(--text3)' }}>Sin evaluar</span>
                  }
                </td>
                <td><SolicitudBadge estado={s.estado} /></td>
                <td>
                  <button className={`btn btn-sm ${s.evaluacion ? 'btn-outline' : 'btn-primary'}`} data-action="eval-modal" data-id={s.id} onClick={() => onEval(s)}>
                    {s.evaluacion ? 'Ver evaluación' : 'Evaluar'}
                  </button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}

export function ModalEval({ open, onClose, sel, puntaje, setPuntaje, obs, setObs, errors, saving, onGuardar }) {
  const yaEval = !!sel?.evaluacion
  return (
    <Modal open={open} onClose={onClose} title={yaEval ? 'Ver evaluación' : 'Evaluar solicitud'} size="lg"
      footer={!yaEval ? <>
        <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn btn-danger"  onClick={() => onGuardar('rechazar')} disabled={saving} id="btn-rechazar-eval">Rechazar</button>
        <button className="btn btn-success" onClick={() => onGuardar('aprobar')}  disabled={saving} id="btn-guardar-eval">{saving ? 'Guardando...' : 'Aprobar'}</button>
      </> : null}
    >
      {sel && (
        <div>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="info-row"><div className="info-lbl">Estudiante</div><div className="info-val" id="eval-nombre">{sel.estudiante?.usuario?.nombre || '—'}</div></div>
            <div className="info-row"><div className="info-lbl">Convocatoria</div><div className="info-val" id="eval-convocatoria">{sel.convocatoria?.nombre || '—'}</div></div>
            <div className="info-row"><div className="info-lbl">Fecha envío</div><div className="info-val" id="eval-fecha-actualizacion">{fmtFecha(sel.fechaEnvio)}</div></div>
            <div className="info-row"><div className="info-lbl">Fecha eval.</div><div className="info-val" id="eval-fecha-evaluacion">{sel.evaluacion ? fmtFecha(sel.evaluacion.fechaEval) : 'Pendiente'}</div></div>
          </div>

          {(sel.documentos || []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="label">Documentos adjuntos</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} id="eval-docs-adjuntos">
                {sel.documentos.map(d => (
                  <a key={d.id} href={documentosApi.fileUrl(d.id)} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: '.78rem', color: 'var(--accent)', textDecoration: 'none' }}>
                    📄 {d.nombre || d.tipo}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="label">Puntaje (0–100)</label>
            <input className="input" type="number" min={0} max={100} value={puntaje}
              onChange={e => setPuntaje(e.target.value)} disabled={yaEval} id="eval-puntaje" />
            {errors.puntaje && <div className="field-error" id="eval-puntaje-err">{errors.puntaje}</div>}
          </div>
          <div className="form-group">
            <label className="label">Observación</label>
            <textarea className="input h-24" value={obs} onChange={e => setObs(e.target.value)}
              disabled={yaEval} placeholder="Mínimo 10 caracteres..." id="eval-obs" />
            {errors.obs && <div className="field-error" id="eval-obs-err">{errors.obs}</div>}
          </div>

          {yaEval && (() => {
            const estadoLabel = {
              APROBADO:     { text: 'Aprobado',     cls: 'alert-success' },
              DESEMBOLSADO: { text: 'Desembolsado', cls: 'alert-success' },
              RECHAZADO:    { text: 'Rechazado',    cls: 'alert-error'   },
              EN_REVISION:  { text: 'En revisión',  cls: 'alert-info'    },
            }
            const { text, cls } = estadoLabel[sel.estado] || { text: sel.estado, cls: 'alert-info' }
            return (
              <div className={`alert ${cls}`} id="eval-ya-evaluada">
                Evaluación registrada. Estado: <strong>{text}</strong>
              </div>
            )
          })()}
        </div>
      )}
    </Modal>
  )
}

function IconFile()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg> }
function IconClock() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function IconCheck() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
function IconX()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> }
