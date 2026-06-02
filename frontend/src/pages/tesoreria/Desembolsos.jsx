import { useEffect, useState } from 'react'
import { pagosApi } from '../../api'
import { useToast } from '../../context/ToastContext'
import { PagoBadge } from '../../components/Badge'
import { ModalDesembolso } from './Dashboard'
import { fmt, fmtFecha, hoy } from '../../utils/helpers'

export default function TesDesembolsos() {
  const toast = useToast()
  const [pagos,   setPagos]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [sel,     setSel]     = useState(null)
  const [txn,     setTxn]     = useState('')
  const [fecha,   setFecha]   = useState('')
  const [cuenta,  setCuenta]  = useState('')
  const [txnErr,  setTxnErr]  = useState('')
  const [saving,  setSaving]  = useState(false)

  async function load() {
    try { const r = await pagosApi.getHistorial(); setPagos(Array.isArray(r.data) ? r.data : (r.data?.items ?? [])) }
    catch { toast.error('Error al cargar historial') }
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
      toast.success('Desembolso confirmado')
      load()
    } catch (err) { toast.error(err.message || 'Error al confirmar desembolso') }
    finally { setSaving(false) }
  }

  function verComprobante(p) {
    const sol = p.solicitud
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Comprobante</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:auto}
      h1{color:#1E3A8A;border-bottom:2px solid #1E3A8A;padding-bottom:10px}
      .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee}
      .label{color:#666;font-size:.9rem}.val{font-weight:600}
      .badge{background:#D1FAE5;color:#065F46;padding:4px 12px;border-radius:20px;font-size:.85rem}
      @media print{button{display:none}}</style></head><body>
      <h1>🎓 Comprobante de Desembolso</h1>
      <p style="color:#666;margin-bottom:20px">Sistema de Gestión de Becas — ITM</p>
      <div class="row"><span class="label">Estudiante</span><span class="val">${sol?.estudiante?.usuario?.nombre || '—'}</span></div>
      <div class="row"><span class="label">Beca</span><span class="val">${sol?.convocatoria?.nombre || '—'}</span></div>
      <div class="row"><span class="label">Monto</span><span class="val" style="color:#10B981">${fmt(p.monto)}</span></div>
      <div class="row"><span class="label">Cuenta bancaria</span><span class="val">${p.cuentaBancaria || '—'}</span></div>
      <div class="row"><span class="label">N° Transacción</span><span class="val">${p.numeroTransaccion || '—'}</span></div>
      <div class="row"><span class="label">Fecha</span><span class="val">${fmtFecha(p.fechaPago)}</span></div>
      <div class="row"><span class="label">Estado</span><span class="badge">Completado ✓</span></div>
      <p style="margin-top:30px;color:#888;font-size:.8rem">Generado el ${new Date().toLocaleDateString('es-CO')}. Válido como constancia de pago.</p>
      <button onclick="window.print()" style="margin-top:20px;padding:10px 24px;background:#1E3A8A;color:white;border:none;border-radius:8px;cursor:pointer;font-size:.95rem">🖨️ Imprimir comprobante</button>
      </body></html>`
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
    else {
      const blob = new Blob([html], { type: 'text/html' })
      window.open(URL.createObjectURL(blob), '_blank')
    }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header"><h1>Historial de desembolsos</h1></div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Estudiante</th><th>Beca</th><th>Monto</th><th>Cuenta</th><th>N° Transacción</th><th>Fecha pago</th><th>Estado</th><th>Acción</th></tr>
            </thead>
            <tbody id="tes-table-hist">
              {pagos.length === 0
                ? <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>Sin registros</td></tr>
                : pagos.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.solicitud?.estudiante?.usuario?.nombre || '—'}</strong></td>
                    <td>{p.solicitud?.convocatoria?.nombre || '—'}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(p.monto)}</td>
                    <td>{p.cuentaBancaria || '—'}</td>
                    <td>{p.numeroTransaccion || '—'}</td>
                    <td>{fmtFecha(p.fechaPago)}</td>
                    <td><PagoBadge estado={p.estado} /></td>
                    <td>
                      {p.estado === 'COMPLETADO'
                        ? <a style={{ color: 'var(--accent)', fontSize: '.8rem', cursor: 'pointer' }} data-action="tes-comprobante" data-id={p.id}
                            onClick={() => verComprobante(p)}>Ver comprobante</a>
                        : <button className="btn btn-success btn-sm" data-action="tes-desembolso" data-id={p.id}
                            onClick={() => openDesembolso(p)}>Confirmar desembolso</button>
                      }
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
