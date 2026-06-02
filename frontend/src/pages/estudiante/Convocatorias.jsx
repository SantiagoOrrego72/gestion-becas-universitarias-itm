import { useEffect, useState, useRef } from 'react'
import { convocatoriasApi, solicitudesApi, documentosApi } from '../../api'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/Modal'
import { ConvBadge } from '../../components/Badge'
import { fmt, fmtFecha, convBadge } from '../../utils/helpers'

export default function EstConvocatorias() {
  const toast = useToast()
  const [convs,      setConvs]      = useState([])
  const [misConvIds, setMisConvIds] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [detalle,    setDetalle]    = useState(null)
  const [postModal,  setPostModal]  = useState(false)
  const [postConv,   setPostConv]   = useState(null)
  const [carta,      setCarta]      = useState('')
  const [archivos,   setArchivos]   = useState([])
  const [postErr,    setPostErr]    = useState('')
  const [sending,    setSending]    = useState(false)
  const fileRef = useRef()

  async function load() {
    try {
      const [cr, sr] = await Promise.all([convocatoriasApi.getAll(), solicitudesApi.getAll()])
      setConvs(cr.data?.items ?? cr.data ?? [])
      const sols = Array.isArray(sr.data) ? sr.data : (sr.data?.items ?? [])
      setMisConvIds(sols.map(s => s.convocatoriaId))
    } catch { toast.error('Error al cargar convocatorias') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openPostular(c) {
    setPostConv(c); setCarta(''); setArchivos([]); setPostErr(''); setPostModal(true)
  }

  function addArchivos(files) {
    Array.from(files).forEach(f => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} excede 5 MB`); return }
      setArchivos(prev => [...prev, f])
    })
  }

  async function enviar() {
    if (!carta || carta.trim().length < 30) { setPostErr('La carta de motivación debe tener al menos 30 caracteres.'); return }
    const docsReq = Array.isArray(postConv?.documentosRequeridos) ? postConv.documentosRequeridos : []
    if (!archivos.length) { setPostErr(docsReq.length ? `Debes adjuntar los ${docsReq.length} documento(s) requerido(s).` : 'Debes adjuntar al menos un documento.'); return }
    if (docsReq.length > 0 && archivos.length < docsReq.length) { setPostErr(`Faltan documentos. Debes adjuntar: ${docsReq.join(', ')}.`); return }
    setSending(true); setPostErr('')
    try {
      const sr  = await solicitudesApi.create({ convocatoriaId: postConv.id, cartaMotivacion: carta.trim() })
      const sol = sr.data
      for (const f of archivos) await documentosApi.upload(f.name, f, sol.id)
      setPostModal(false)
      toast.success('¡Solicitud enviada exitosamente! Estado: En revisión')
      load()
    } catch (err) { setPostErr(err.message || 'Error al enviar solicitud') }
    finally { setSending(false) }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header"><h1>Convocatorias</h1></div>

      {convs.length === 0
        ? <div className="card" style={{ textAlign: 'center', color: 'var(--text3)' }}>No hay convocatorias disponibles.</div>
        : <div className="conv-grid">
            {convs.map(c => {
              const yaPostuló = misConvIds.includes(c.id)
              const { esAbierta } = convBadge(c)
              const reqs = (c.requisitos || '').split('\n').filter(Boolean)
              const docsReq = Array.isArray(c.documentosRequeridos) ? c.documentosRequeridos : []
              return (
                <div key={c.id} className="conv-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <h3>{c.nombre}</h3>
                    <ConvBadge estado={c.estado} fechaFin={c.fechaFin} />
                  </div>
                  {c.descripcion && <p>{c.descripcion}</p>}
                  <div className="meta">
                    <span>💰 <strong style={{ color: 'var(--success)' }}>{fmt(c.monto)}</strong></span>
                    <span>📅 Cierre: {fmtFecha(c.fechaFin)}</span>
                    <span>👥 {c.cuposTotal - c.cuposUsados} de {c.cuposTotal} cupos</span>
                  </div>
                  {reqs.length > 0 && (
                    <div className="reqs">
                      <strong>Requisitos:</strong>
                      <ul>{reqs.map((r, i) => <li key={i}>{r}</li>)}</ul>
                    </div>
                  )}
                  <div className="actions">
                    <button className="btn btn-outline btn-sm" onClick={() => setDetalle(c)}>Ver detalles</button>
                    {yaPostuló
                      ? <button className="btn btn-sm badge-gray" disabled>Ya postulado</button>
                      : !esAbierta
                        ? <button className="btn btn-sm" style={{ background: '#FEE2E2', color: '#991B1B', cursor: 'default' }} disabled>No disponible</button>
                        : <button className="btn btn-primary btn-sm" onClick={() => openPostular(c)}>Aplicar</button>
                    }
                  </div>
                </div>
              )
            })}
          </div>
      }

      {/* Modal detalle */}
      <Modal open={!!detalle} onClose={() => setDetalle(null)} title={detalle?.nombre || ''} size="lg"
        footer={detalle && !misConvIds.includes(detalle.id) && convBadge(detalle).esAbierta
          ? <button className="btn btn-primary" onClick={() => { setDetalle(null); openPostular(detalle) }}>Aplicar ahora</button>
          : null
        }
      >
        {detalle && (
          <div style={{ fontSize: '.84rem' }}>
            <p style={{ color: 'var(--text2)', marginBottom: 16 }}>{detalle.descripcion || '—'}</p>
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div className="info-row"><div className="info-lbl">Monto</div><div className="info-val" style={{ color: 'var(--success)' }}>{fmt(detalle.monto)}</div></div>
              <div className="info-row"><div className="info-lbl">Cupos</div><div className="info-val">{detalle.cuposTotal - detalle.cuposUsados} / {detalle.cuposTotal}</div></div>
              <div className="info-row"><div className="info-lbl">Inicio</div><div className="info-val">{fmtFecha(detalle.fechaInicio)}</div></div>
              <div className="info-row"><div className="info-lbl">Cierre</div><div className="info-val">{fmtFecha(detalle.fechaFin)}</div></div>
            </div>
            {(detalle.requisitos || '').split('\n').filter(Boolean).length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <strong>Requisitos:</strong>
                <ul style={{ marginLeft: 18, marginTop: 6, color: 'var(--text2)' }}>
                  {detalle.requisitos.split('\n').filter(Boolean).map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
            {(Array.isArray(detalle.documentosRequeridos) ? detalle.documentosRequeridos : []).length > 0 && (
              <div>
                <strong>Documentos requeridos:</strong>
                <ul style={{ marginLeft: 18, marginTop: 6, color: 'var(--text2)' }}>
                  {detalle.documentosRequeridos.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal postular */}
      <Modal open={postModal} onClose={() => setPostModal(false)} title="Postular a beca" size="lg"
        footer={<>
          <button className="btn btn-outline" onClick={() => setPostModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={enviar} disabled={sending}>{sending ? 'Enviando...' : 'Enviar solicitud'}</button>
        </>}
      >
        {postConv && (
          <div>
            <div className="form-group">
              <label className="label">Convocatoria</label>
              <input className="input" value={postConv.nombre} readOnly style={{ background: 'var(--bg)' }} />
            </div>

            {Array.isArray(postConv.documentosRequeridos) && postConv.documentosRequeridos.length > 0 && (
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                <strong>Documentos requeridos:</strong>
                <ul style={{ marginLeft: 18, marginTop: 6 }}>
                  {postConv.documentosRequeridos.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}

            <div className="form-group">
              <label className="label">Carta de motivación <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(mín. 30 caracteres)</span></label>
              <textarea className="input h-28" placeholder="Describe por qué mereces esta beca..." value={carta} onChange={e => setCarta(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="label">Documentos adjuntos</label>
              <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                Haz clic para seleccionar archivos (PDF, máx. 5 MB c/u)
              </div>
              <input ref={fileRef} type="file" className="hidden" style={{ display: 'none' }} multiple
                onChange={e => { addArchivos(e.target.files); e.target.value = '' }} />
              {archivos.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {archivos.map((f, i) => (
                    <div key={i} className="doc-item">
                      📄 <span className="doc-name">{f.name}</span>
                      <span style={{ color: 'var(--text3)', fontSize: '.72rem' }}>({(f.size/1024).toFixed(1)} KB)</span>
                      <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '.9rem' }}
                        onClick={() => setArchivos(a => a.filter((_, j) => j !== i))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {postErr && <div className="alert alert-error">{postErr}</div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
