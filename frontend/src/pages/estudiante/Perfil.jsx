import { useEffect, useState } from 'react'
import { authApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/Modal'
import { initials } from '../../utils/helpers'

export default function EstPerfil() {
  const { updateUser } = useAuth()
  const toast = useToast()
  const [perfil,     setPerfil]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [editModal,  setEditModal]  = useState(false)
  const [editForm,   setEditForm]   = useState({ nombre: '', programa: '', semestre: '', cuentaBancaria: '' })
  const [saving,     setSaving]     = useState(false)
  const [passModal,  setPassModal]  = useState(false)
  const [passForm,   setPassForm]   = useState({ actual: '', nueva: '', nueva2: '' })
  const [savingPass, setSavingPass] = useState(false)

  async function load() {
    try { const r = await authApi.me(); setPerfil(r.data) }
    catch { toast.error('Error al cargar perfil') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function openEdit() {
    setEditForm({
      nombre: perfil?.nombre || '',
      programa: perfil?.estudiante?.programa || '',
      semestre: perfil?.estudiante?.semestre || '',
      cuentaBancaria: perfil?.estudiante?.cuentaBancaria || '',
    })
    setEditModal(true)
  }

  async function guardarPerfil() {
    if (!editForm.nombre.trim()) { toast.error('El nombre no puede estar vacío'); return }
    setSaving(true)
    try {
      const r = await authApi.updateProfile({
        nombre: editForm.nombre.trim(),
        programa: editForm.programa.trim(),
        semestre: parseInt(editForm.semestre) || undefined,
        cuentaBancaria: editForm.cuentaBancaria.trim() || null,
      })
      updateUser({ nombre: r.data?.nombre || editForm.nombre })
      setEditModal(false)
      toast.success('Perfil actualizado correctamente')
      load()
    } catch (err) { toast.error(err.message || 'Error al guardar perfil') }
    finally { setSaving(false) }
  }

  async function cambiarContrasena() {
    const { actual, nueva, nueva2 } = passForm
    if (!actual || !nueva || !nueva2) { toast.error('Completa todos los campos'); return }
    if (nueva !== nueva2)             { toast.error('Las contraseñas nuevas no coinciden'); return }
    if (nueva.length < 8)             { toast.error('La nueva contraseña debe tener mínimo 8 caracteres'); return }
    setSavingPass(true)
    try {
      await authApi.changePassword(actual, nueva)
      setPassModal(false)
      setPassForm({ actual: '', nueva: '', nueva2: '' })
      toast.success('Contraseña actualizada correctamente')
    } catch (err) { toast.error(err.message || 'Error al cambiar contraseña') }
    finally { setSavingPass(false) }
  }

  if (loading || !perfil) return <div className="spinner-wrap"><div className="spinner" /></div>

  const ini = initials(perfil.nombre)

  return (
    <div>
      <div className="page-header"><h1>Mi perfil</h1></div>

      <div className="grid-2">
        {/* Avatar */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', gap: 12 }}>
          <div id="perfil-avatar" style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', fontWeight: 700,
          }}>{ini}</div>
          <div id="perfil-name" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{perfil.nombre}</div>
          <div style={{ fontSize: '.8rem', color: 'var(--text3)' }}>{perfil.correo}</div>
          <span className="badge badge-blue">Estudiante</span>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" style={{ width: '100%' }} id="btn-editar-perfil" onClick={openEdit}>Editar perfil</button>
            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setPassModal(true)}>Cambiar contraseña</button>
          </div>
        </div>

        {/* Info */}
        <div className="card">
          <div className="card-title">Información personal</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { lbl: 'Nombre completo',  val: perfil.nombre,                          id: 'perfil-fullname' },
              { lbl: 'Correo',           val: perfil.correo,                          id: 'perfil-email'    },
              { lbl: 'Programa',         val: perfil.estudiante?.programa || '—',     id: 'perfil-programa' },
              { lbl: 'Documento',        val: perfil.estudiante?.documento || '—',    id: 'perfil-doc'      },
              { lbl: 'Semestre',         val: perfil.estudiante?.semestre ?? '—'    },
              { lbl: 'Cuenta bancaria',  val: perfil.estudiante?.cuentaBancaria || '—' },
            ].map((f, i) => (
              <div key={i} className="info-row" id={f.id}>
                <div className="info-lbl">{f.lbl}</div>
                <div className="info-val">{f.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal editar */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar perfil"
        footer={<>
          <button className="btn btn-outline" onClick={() => setEditModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardarPerfil} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
        </>}
      >
        {[
          { label: 'Nombre completo',  key: 'nombre',         type: 'text'   },
          { label: 'Programa',         key: 'programa',       type: 'text'   },
          { label: 'Semestre',         key: 'semestre',       type: 'number' },
          { label: 'Cuenta bancaria',  key: 'cuentaBancaria', type: 'text'   },
        ].map(f => (
          <div className="form-group" key={f.key}>
            <label className="label">{f.label}</label>
            <input className="input" type={f.type} value={editForm[f.key]}
              onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))} />
          </div>
        ))}
      </Modal>

      {/* Modal contraseña */}
      <Modal open={passModal} onClose={() => setPassModal(false)} title="Cambiar contraseña"
        footer={<>
          <button className="btn btn-outline" onClick={() => setPassModal(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={cambiarContrasena} disabled={savingPass} id="btn-cambiar-pass">{savingPass ? 'Guardando...' : 'Cambiar contraseña'}</button>
        </>}
      >
        {[
          { label: 'Contraseña actual',    key: 'actual' },
          { label: 'Nueva contraseña',     key: 'nueva'  },
          { label: 'Confirmar contraseña', key: 'nueva2' },
        ].map(f => (
          <div className="form-group" key={f.key}>
            <label className="label">{f.label}</label>
            <input className="input" type="password" value={passForm[f.key]}
              onChange={e => setPassForm(p => ({ ...p, [f.key]: e.target.value }))} />
          </div>
        ))}
      </Modal>
    </div>
  )
}
