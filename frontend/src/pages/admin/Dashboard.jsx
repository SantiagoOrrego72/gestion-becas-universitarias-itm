import { useEffect, useState } from 'react'
import { convocatoriasApi, solicitudesApi } from '../../api'
import { useToast } from '../../context/ToastContext'
import { StatCard, ConvBadge } from '../../components/Badge'
import Modal from '../../components/Modal'
import { fmt, fmtFecha } from '../../utils/helpers'

export default function AdminDashboard() {
  const toast = useToast()
  const [convs,    setConvs]    = useState([])
  const [sols,     setSols]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [editando, setEditando] = useState(null)
  const [form,     setForm]     = useState(emptyForm())
  const [formErr,  setFormErr]  = useState('')
  const [saving,   setSaving]   = useState(false)

  function emptyForm() {
    return { nombre: '', fechaInicio: '', fechaFin: '', cuposTotal: '', monto: '', descripcion: '', requisitos: '', documentosRequeridos: '', estado: 'ABIERTA' }
  }

  async function load() {
    try {
      const [cr, sr] = await Promise.all([convocatoriasApi.getAll(), solicitudesApi.getAll()])
      setConvs(cr.data?.items ?? cr.data ?? [])
      setSols(Array.isArray(sr.data) ? sr.data : (sr.data?.items ?? []))
    } catch { toast.error('Error al cargar panel de administración') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function openNueva() { setEditando(null); setForm(emptyForm()); setFormErr(''); setModal(true) }

  function openEditar(c) {
    setEditando(c.id)
    setForm({
      nombre: c.nombre, fechaInicio: c.fechaInicio?.split('T')[0] || '',
      fechaFin: c.fechaFin?.split('T')[0] || '', cuposTotal: c.cuposTotal,
      monto: c.monto, descripcion: c.descripcion || '', requisitos: c.requisitos || '',
      documentosRequeridos: (c.documentosRequeridos || []).join('\n'), estado: c.estado,
    })
    setFormErr(''); setModal(true)
  }

  async function guardar() {
    if (!form.nombre || !form.fechaInicio || !form.fechaFin || !form.cuposTotal || !form.monto) {
      setFormErr('Completa todos los campos obligatorios.'); return
    }
    if (new Date(form.fechaFin) < new Date(form.fechaInicio)) {
      setFormErr('La fecha de cierre no puede ser anterior a la de inicio.'); return
    }
    setFormErr(''); setSaving(true)
    const payload = {
      nombre: form.nombre.trim(), fechaInicio: form.fechaInicio, fechaFin: form.fechaFin,
      cuposTotal: parseInt(form.cuposTotal), monto: parseFloat(form.monto),
      descripcion: form.descripcion.trim(), requisitos: form.requisitos.trim(),
      documentosRequeridos: form.documentosRequeridos.split('\n').map(s => s.trim()).filter(Boolean),
      estado: form.estado,
    }
    try {
      if (editando) { await convocatoriasApi.update(editando, payload); toast.success('Convocatoria actualizada') }
      else          { await convocatoriasApi.create(payload);           toast.success('Convocatoria creada') }
      setModal(false); load()
    } catch (err) { setFormErr(err.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  async function eliminar(id) {
    if (!window.confirm('¿Estás seguro de eliminar esta convocatoria?')) return
    try { await convocatoriasApi.delete(id); toast.success('Convocatoria eliminada'); load() }
    catch (err) { toast.error(err.message || 'Error al eliminar') }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  const abiertas    = convs.filter(c => c.estado === 'ABIERTA').length
  const presupuesto = convs.reduce((a, c) => a + Number(c.monto), 0)

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div><h1>Panel de Administración</h1></div>
        <button className="btn btn-primary" id="btn-nueva-conv" onClick={openNueva}>+ Nueva convocatoria</button>
      </div>

      <div className="stats-grid">
        <StatCard label="Total convocatorias" value={convs.length}       color="blue"   icon={<IconConv />} />
        <StatCard label="Abiertas"            value={abiertas}           color="green"  icon={<IconCheck />} />
        <StatCard label="Solicitudes"         value={sols.length}        color="yellow" icon={<IconFile />} />
        <StatCard label="Presupuesto total"   value={fmt(presupuesto)}   color="purple" icon={<IconDol />} />
      </div>

      <div className="card">
        <div className="card-title">Convocatorias</div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Nombre</th><th>Monto</th><th>Cupos</th><th>Cierre</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody id="admin-conv-table">
              {convs.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>Sin convocatorias</td></tr>
                : convs.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.nombre}</strong></td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(c.monto)}</td>
                    <td>{c.cuposUsados}/{c.cuposTotal}</td>
                    <td>{fmtFecha(c.fechaFin)}</td>
                    <td><ConvBadge estado={c.estado} fechaFin={c.fechaFin} /></td>
                    <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-sm btn-warning" data-action="admin-edit-conv" data-id={c.id} onClick={() => openEditar(c)}>Editar</button>
                      <button className="btn btn-sm btn-danger"  data-action="admin-del-conv"  data-id={c.id} onClick={() => eliminar(c.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editando ? 'Editar Convocatoria' : 'Nueva Convocatoria'} size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" id="btn-guardar-conv" onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1/-1' }} className="form-group">
            <label className="label">Nombre <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="input" id="conv-nombre" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          {[
            { label: 'Fecha inicio *', key: 'fechaInicio', type: 'date', id: 'conv-inicio' },
            { label: 'Fecha cierre *', key: 'fechaFin',    type: 'date', id: 'conv-fin'    },
            { label: 'Cupos *',        key: 'cuposTotal',  type: 'number', id: 'conv-cupos' },
            { label: 'Monto (COP) *',  key: 'monto',       type: 'number', id: 'conv-monto' },
          ].map(f => (
            <div className="form-group" key={f.key}>
              <label className="label">{f.label}</label>
              <input className="input" id={f.id} type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div style={{ gridColumn: '1/-1' }} className="form-group">
            <label className="label">Descripción</label>
            <textarea className="input h-20" id="conv-desc" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1/-1' }} className="form-group">
            <label className="label">Requisitos <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: '.76rem' }}>(uno por línea)</span></label>
            <textarea className="input h-20" id="conv-requisitos" value={form.requisitos} onChange={e => setForm(f => ({ ...f, requisitos: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1/-1' }} className="form-group">
            <label className="label">Documentos requeridos <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: '.76rem' }}>(uno por línea)</span></label>
            <textarea className="input h-20" id="conv-documentos" value={form.documentosRequeridos} onChange={e => setForm(f => ({ ...f, documentosRequeridos: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Estado</label>
            <select className="input" id="conv-estado" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
              <option value="ABIERTA">Abierta</option>
              <option value="CERRADA">Cerrada</option>
            </select>
          </div>
          {formErr && <div style={{ gridColumn: '1/-1' }} className="alert alert-error" id="conv-fecha-err">{formErr}</div>}
        </div>
      </Modal>
    </div>
  )
}

function IconConv()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="3" width="20" height="14" rx="2"/></svg> }
function IconCheck() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
function IconFile()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg> }
function IconDol()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> }
