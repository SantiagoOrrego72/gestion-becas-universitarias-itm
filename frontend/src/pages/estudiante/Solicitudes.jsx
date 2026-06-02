import { useEffect, useState } from 'react'
import { solicitudesApi, documentosApi } from '../../api'
import { useToast } from '../../context/ToastContext'
import { SolicitudBadge } from '../../components/Badge'
import { fmtFecha } from '../../utils/helpers'

export default function EstSolicitudes() {
  const toast = useToast()
  const [sols,    setSols]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const r = await solicitudesApi.getAll()
        setSols(Array.isArray(r.data) ? r.data : (r.data?.items ?? []))
      } catch { toast.error('Error al cargar solicitudes') }
      finally  { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header"><h1>Mis solicitudes</h1></div>

      {sols.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }} id="no-solicitudes">
          <p style={{ color: 'var(--text3)' }}>No has enviado solicitudes aún.</p>
          <p style={{ color: 'var(--text3)', marginTop: 4 }}>Ve a <strong>Convocatorias</strong> para aplicar.</p>
        </div>
      ) : (
        sols.map(s => {
          const esPos = ['APROBADO', 'DESEMBOLSADO'].includes(s.estado)
          return (
            <div key={s.id} className="sol-card">
              <div className="sol-card-header">
                <h3>{s.convocatoria?.nombre}</h3>
                <SolicitudBadge estado={s.estado} />
              </div>
              <div className="sol-meta">
                <span>📅 Enviada: {fmtFecha(s.fechaEnvio)}</span>
                <span>🔄 Actualizada: {fmtFecha(s.fechaActualizacion)}</span>
                <span>📎 {(s.documentos || []).length} documentos</span>
              </div>

              {(s.documentos || []).length > 0 && (
                <div className="docs-grid">
                  {s.documentos.map(d => (
                    <div key={d.id} className="doc-item">
                      📄
                      <div>
                        <div className="doc-name">{d.nombre || d.tipo}</div>
                        <div className="doc-type">{d.mimeType?.includes('pdf') ? 'PDF' : 'Imagen'}</div>
                      </div>
                      <span className={`badge badge-${d.estado === 'VERIFICADO' ? 'green' : 'yellow'}`} style={{ marginLeft: 'auto' }}>
                        {d.estado === 'VERIFICADO' ? 'Verificado' : 'Pendiente'}
                      </span>
                      <a href={documentosApi.fileUrl(d.id)} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--accent)', fontSize: '.76rem', marginLeft: 8, whiteSpace: 'nowrap' }}>
                        Ver ↗
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {s.evaluacion ? (
                <div className="info-banner" style={{
                  background: esPos ? '#D1FAE5' : '#FEE2E2',
                  borderColor: esPos ? '#6EE7B7' : '#FCA5A5',
                  color: esPos ? '#065F46' : '#991B1B',
                }}>
                  <strong>Puntaje: {s.evaluacion.puntaje}/100</strong><br />
                  Observación: {s.evaluacion.observacion}
                </div>
              ) : (
                <div className="info-banner">
                  Tu solicitud está siendo revisada por el equipo de evaluación.
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
