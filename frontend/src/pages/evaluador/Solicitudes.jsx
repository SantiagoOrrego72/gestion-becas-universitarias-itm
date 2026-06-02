import { useEffect, useState } from 'react'
import { solicitudesApi, evaluacionesApi, documentosApi } from '../../api'
import { useToast } from '../../context/ToastContext'
import { TablaEval, ModalEval } from './Dashboard'

export default function EvalSolicitudes() {
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
      <div className="page-header"><h1>Solicitudes para evaluar</h1></div>
      <div className="card">
        <TablaEval sols={sols} onEval={openModal} />
      </div>
      <ModalEval open={modal} onClose={() => setModal(false)} sel={sel}
        puntaje={puntaje} setPuntaje={setPuntaje} obs={obs} setObs={setObs}
        errors={errors} saving={saving} onGuardar={guardar} />
    </div>
  )
}
