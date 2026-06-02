import { useEffect, useState } from 'react'
import { pagosApi } from '../../api'
import { useToast } from '../../context/ToastContext'
import { StatCard, PagoBadge } from '../../components/Badge'
import Modal from '../../components/Modal'
import { fmt, fmtFecha, hoy } from '../../utils/helpers'

export default function TesDashboard() {
  const toast = useToast()
  const [pagos,    setPagos]    = useState({ todos: [], pendientes: [] })
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [sel,      setSel]      = useState(null)
  const [txn,      setTxn]      = useState('')
  const [fecha,    setFecha]    = useState('')
  const [cuenta,   setCuenta]   = useState('')
  const [txnErr,   setTxnErr]   = useState('')
  const [saving,   setSaving]   = useState(false)

  async function load() {
    try {
      const [tr, pr] = await Promise.all([pagosApi.getAll(), pagosApi.getAll({ estado: 'PENDIENTE' })])
      setPagos({
        todos:      Array.isArray(tr.data) ? tr.data : (tr.data?.items ?? []),
        pendientes: Array.isArray(pr.data) ? pr.data : (pr.data?.items ?? []),
      })
    } catch { toast.error('Error al cargar dashboard de tesorería') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function openDesembolso(p) {
    setSel(p); setTxn(''); setFecha(hoy()); setCuenta(p.cuentaBancaria || ''); setTxnErr(''); setModal(true)
  }

  async function confirmar() {
    if (!txn.trim()) { setTxnErr('El número de transacción es obligatorio.'); return }
    if (!fecha)      { toast.error('Selecciona una fecha'); return }
    setSaving(true)
    try {
      await pagosApi.confirmar(sel.id, { numeroTransaccion: txn.trim(), fechaPago: fecha, cuentaBancaria: cuenta.trim() })
      setModal(false)
      toast.success('Desembolso confirmado y registrado como Completado')
      load()
    } catch (err) { toast.error(err.message || 'Error al confirmar desembolso') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  const { todos, pendientes } = pagos
  const completados    = todos.filter(x => x.estado === 'COMPLETADO').length
  const totalDesemb    = todos.filter(x => x.estado === 'PENDIENTE').reduce((a, x) => a + x.monto, 0)
  const totalProcesado = todos.filter(x => x.estado !== 'PENDIENTE').reduce((a, x) => a + x.monto, 0)

  return (
    <div>
      <div className="page-header"><h1>Panel de Tesorería</h1></div>

      <div className="stats-grid" id="tes-stats">
        <StatCard label="Total a desembolsar" value={fmt(totalDesemb)}    color="blue"   icon={<IconDol />} />
        <StatCard label="Pendientes"          value={pendientes.length}   color="yellow" icon={<IconClock />} />
        <StatCard label="Completados"         value={completados}         color="green"  icon={<IconCheck />} />
        <StatCard label="Total procesado"     value={fmt(totalProcesado)} color="purple" icon={<IconCard />} />
      </div>

      <div className="card">
        <div className="card-title">Desembolsos pendientes</div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Estudiante</th><th>Beca</th><th>Monto</th><th>Cuenta bancaria</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody id="tes-table-dash">
              {pendientes.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>Sin desembolsos pendientes</td></tr>
                : pendientes.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.solicitud?.estudiante?.usuario?.nombre || '—'}</strong></td>
                    <td>{p.solicitud?.convocatoria?.nombre || '—'}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(p.monto)}</td>
                    <td>{p.cuentaBancaria || '—'}</td>
                    <td><PagoBadge estado={p.estado} /></td>
                    <td>
                      <button className="btn btn-success btn-sm" data-action="tes-desembolso" data-id={p.id} onClick={() => openDesembolso(p)}>
                        Confirmar desembolso
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <ModalDesembolso open={modal} onClose={() => setModal(false)} sel={sel}
        txn={txn} setTxn={setTxn} fecha={fecha} setFecha={setFecha}
        cuenta={cuenta} setCuenta={setCuenta} txnErr={txnErr} setTxnErr={setTxnErr}
        saving={saving} onConfirmar={confirmar} />
    </div>
  )
}

export function ModalDesembolso({ open, onClose, sel, txn, setTxn, fecha, setFecha, cuenta, setCuenta, txnErr, setTxnErr, saving, onConfirmar }) {
  return (
    <Modal open={open} onClose={onClose} title="Confirmar desembolso"
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn btn-success" id="btn-confirmar-desembolso" onClick={onConfirmar} disabled={saving}>{saving ? 'Procesando...' : 'Confirmar'}</button>
      </>}
    >
      {sel && (
        <div>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="info-row"><div className="info-lbl">Estudiante</div><div className="info-val" id="desembolso-nombre">{sel.solicitud?.estudiante?.usuario?.nombre || '—'}</div></div>
            <div className="info-row"><div className="info-lbl">Beca</div><div className="info-val" id="desembolso-beca">{sel.solicitud?.convocatoria?.nombre || '—'}</div></div>
            <div className="info-row" style={{ gridColumn: '1/-1' }}><div className="info-lbl">Monto</div><div className="info-val" style={{ color: 'var(--success)' }} id="desembolso-monto">{fmt(sel.monto)}</div></div>
          </div>
          <div className="form-group">
            <label className="label">Número de transacción <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="input" id="desembolso-txn" placeholder="TXN-20240601-001" value={txn}
              onChange={e => { setTxn(e.target.value); setTxnErr('') }} />
            {txnErr && <div className="field-error" id="desembolso-txn-err">{txnErr}</div>}
          </div>
          <div className="form-group">
            <label className="label">Cuenta bancaria destino</label>
            <input className="input" id="desembolso-cuenta" value={cuenta} onChange={e => setCuenta(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Fecha de desembolso</label>
            <input className="input" id="desembolso-fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
        </div>
      )}
    </Modal>
  )
}

function IconDol()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> }
function IconClock(){ return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function IconCheck(){ return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
function IconCard() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> }
