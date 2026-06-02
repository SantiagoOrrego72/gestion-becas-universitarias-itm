import { useEffect, useState, useRef } from 'react'
import { documentosApi } from '../../api'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/Modal'
import { fmtFecha } from '../../utils/helpers'

const TIPOS = ['Documento de identidad', 'Certificado de notas', 'Carta de recomendación', 'Comprobante de matrícula', 'Otro']

const EST_CLS = { VERIFICADO: 'badge-green', RECHAZADO: 'badge-red', PENDIENTE: 'badge-yellow' }
const EST_LBL = { VERIFICADO: 'Verificado', RECHAZADO: 'Rechazado', PENDIENTE: 'Pendiente' }

export default function EstDocumentos() {
  const toast = useToast()
  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [tipo,    setTipo]    = useState(TIPOS[0])
  const [file,    setFile]    = useState(null)
  const [saving,  setSaving]  = useState(false)
  const fileRef = useRef()

  async function load() {
    try { const r = await documentosApi.getMios(); setDocs(r.data ?? []) }
    catch { toast.error('Error al cargar documentos') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openModal() { setTipo(TIPOS[0]); setFile(null); setModal(true) }

  function onFileChange(e) {
    const f = e.target.files[0]; if (!f) return
    if (f.type !== 'application/pdf') { toast.error('Solo se permiten archivos PDF'); e.target.value = ''; return }
    if (f.size > 5 * 1024 * 1024)    { toast.error('El archivo excede 5 MB'); e.target.value = ''; return }
    setFile(f)
  }

  async function subirDocumento() {
    if (!file) { toast.error('Selecciona un archivo PDF primero'); return }
    setSaving(true)
    try {
      await documentosApi.upload(tipo, file)
      setModal(false)
      toast.success('Documento subido. Pendiente de verificación.')
      load()
    } catch (err) { toast.error(err.message || 'Error al subir documento') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div><h1>Mis documentos</h1></div>
        <button className="btn btn-primary" onClick={openModal}>+ Subir documento</button>
      </div>

      <div className="card">
        {docs.length === 0
          ? <p style={{ textAlign: 'center', color: 'var(--text3)', padding: '24px 0' }}>No tienes documentos cargados aún</p>
          : <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Tipo</th><th>Nombre</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {docs.map(d => (
                    <tr key={d.id}>
                      <td><strong>{d.tipo}</strong></td>
                      <td>{d.nombre}</td>
                      <td>{fmtFecha(d.creadoEn)}</td>
                      <td><span className={`badge ${EST_CLS[d.estado] || 'badge-gray'}`}>{EST_LBL[d.estado] || d.estado}</span></td>
                      <td>
                        <a href={documentosApi.fileUrl(d.id)} target="_blank" rel="noreferrer"
                          style={{ color: 'var(--accent)', fontSize: '.8rem' }}>
                          Ver documento ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Subir documento"
        footer={<>
          <button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={subirDocumento} disabled={saving || !file}>
            {saving ? 'Subiendo...' : 'Subir'}
          </button>
        </>}
      >
        <div>
          <div className="form-group">
            <label className="label">Tipo de documento</label>
            <select className="input" value={tipo} onChange={e => setTipo(e.target.value)}>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Archivo PDF</label>
            <div className="upload-zone" onClick={() => fileRef.current?.click()} id="zona-upload">
              {file
                ? <><strong style={{ color: 'var(--primary)' }}>📄 {file.name}</strong></>
                : 'Haz clic para seleccionar un PDF (máx. 5 MB)'
              }
            </div>
            <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={onFileChange} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
