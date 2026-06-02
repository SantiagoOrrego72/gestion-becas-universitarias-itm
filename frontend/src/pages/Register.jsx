import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'

export default function Register() {
  const navigate = useNavigate()
  const bgRef    = useRef(null)

  const [form, setForm] = useState({
    nombre: '', correo: '', password: '', password2: '', programa: '', documento: '',
  })
  const [errors,  setErrors]  = useState({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [glow,    setGlow]    = useState({ x: 50, y: 50 })

  const onMouseMove = useCallback((e) => {
    const rect = bgRef.current?.getBoundingClientRect()
    if (!rect) return
    setGlow({
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    })
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function validate() {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.correo.trim()) e.correo = 'El correo es obligatorio'
    else if (!/\.(edu|edu\.co)$/i.test(form.correo))
      e.correo = 'Solo se permiten correos institucionales (.edu o .edu.co)'
    if (!form.programa.trim()) e.programa = 'El programa es obligatorio'
    if (!form.documento.trim()) e.documento = 'El documento es obligatorio'
    if (!form.password) e.password = 'La contraseña es obligatoria'
    else if (form.password.length < 8)                          e.password = 'Mínimo 8 caracteres'
    else if (!/[A-Z]/.test(form.password))                     e.password = 'Debe tener al menos una mayúscula'
    else if (!/[0-9]/.test(form.password))                     e.password = 'Debe tener al menos un número'
    else if (!/[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/.test(form.password))
      e.password = 'Debe tener al menos un carácter especial'
    if (form.password !== form.password2) e.password2 = 'Las contraseñas no coinciden'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await authApi.register({
        nombre: form.nombre, correo: form.correo, password: form.password,
        programa: form.programa, documento: form.documento,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2200)
    } catch (err) {
      setErrors({ general: err.message || 'Error en el registro' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={bgRef}
      onMouseMove={onMouseMove}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)',
      }}
    >
      {/* Luz que sigue al mouse */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(600px circle at ${glow.x}% ${glow.y}%,
          rgba(99,179,255,.18) 0%, rgba(59,130,246,.08) 40%, transparent 70%)`,
        transition: 'background .05s ease',
      }} />

      {/* Círculos decorativos */}
      <div style={{ position:'absolute', top:'-100px', right:'-60px', width:360, height:360, borderRadius:'50%', background:'rgba(99,179,255,.05)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'-80px', left:'-50px', width:280, height:280, borderRadius:'50%', background:'rgba(139,92,246,.07)', pointerEvents:'none', zIndex:0 }} />

      {/* Contenido */}
      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:620 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{
            width:90, height:90,
            borderRadius:'50%',
            background:'rgba(255,255,255,.95)',
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            marginBottom:12,
            boxShadow:'0 0 0 3px rgba(255,255,255,.2), 0 8px 32px rgba(0,0,0,.3)',
            overflow:'hidden',
          }}>
            <img
              src="/logo-itm.png"
              alt="Logo ITM"
              style={{ width:'88%', height:'88%', objectFit:'contain' }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = '<span style="font-size:1.6rem;font-weight:800;color:#1e3a8a">ITM</span>'
              }}
            />
          </div>
          <div style={{ fontSize:'1.4rem', fontWeight:700, color:'#fff' }}>Sistema de Becas</div>
          <div style={{ fontSize:'.82rem', color:'rgba(255,255,255,.5)', marginTop:3 }}>
            Instituto Tecnológico Metropolitano
          </div>
        </div>

        {/* Card */}
        <div style={{
          background:'rgba(255,255,255,.97)',
          borderRadius:20,
          padding:'36px 40px 32px',
          boxShadow:'0 24px 64px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.08)',
        }}>
          <h2 style={{ fontSize:'1.15rem', fontWeight:700, marginBottom:24, color:'#0f172a' }}>
            Crear cuenta
          </h2>

          {success && (
            <div className="alert alert-success" style={{ marginBottom:20 }}>
              ✓ ¡Cuenta creada exitosamente! Redirigiendo al login...
            </div>
          )}
          {errors.general && (
            <div className="alert alert-error" style={{ marginBottom:20 }}>{errors.general}</div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Fila 1: Nombre + Correo */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div>
                <label className="label">Nombre completo</label>
                <input className="input" placeholder="Juan Pérez"
                  value={form.nombre} onChange={set('nombre')}
                  style={{ fontSize:'.88rem', padding:'10px 13px' }} />
                {errors.nombre && <div className="field-error">{errors.nombre}</div>}
              </div>
              <div>
                <label className="label">Correo institucional</label>
                <input className="input" type="email" placeholder="usuario@itm.edu.co"
                  value={form.correo} onChange={set('correo')}
                  style={{ fontSize:'.88rem', padding:'10px 13px' }} />
                {errors.correo && <div className="field-error">{errors.correo}</div>}
              </div>
            </div>

            {/* Fila 2: Programa + Documento */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div>
                <label className="label">Programa académico</label>
                <input className="input" placeholder="Ingeniería de Sistemas"
                  value={form.programa} onChange={set('programa')}
                  style={{ fontSize:'.88rem', padding:'10px 13px' }} />
                {errors.programa && <div className="field-error">{errors.programa}</div>}
              </div>
              <div>
                <label className="label">Número de documento</label>
                <input className="input" placeholder="1000000000"
                  value={form.documento} onChange={set('documento')}
                  style={{ fontSize:'.88rem', padding:'10px 13px' }} />
                {errors.documento && <div className="field-error">{errors.documento}</div>}
              </div>
            </div>

            {/* Fila 3: Contraseñas */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:4 }}>
              <div>
                <label className="label">Contraseña</label>
                <input className="input" type="password"
                  placeholder="Mín. 8 chars, mayúscula, número, especial"
                  value={form.password} onChange={set('password')}
                  style={{ fontSize:'.88rem', padding:'10px 13px' }} />
                {errors.password && <div className="field-error">{errors.password}</div>}
              </div>
              <div>
                <label className="label">Confirmar contraseña</label>
                <input className="input" type="password" placeholder="Repite la contraseña"
                  value={form.password2} onChange={set('password2')}
                  style={{ fontSize:'.88rem', padding:'10px 13px' }} />
                {errors.password2 && <div className="field-error">{errors.password2}</div>}
              </div>
            </div>

            {/* Requisitos de contraseña */}
            <div style={{
              display:'flex', flexWrap:'wrap', gap:'6px 12px',
              margin:'12px 0 20px',
              fontSize:'.72rem', color:'var(--text3)',
            }}>
              {[
                { ok: form.password.length >= 8,               txt: '8+ caracteres' },
                { ok: /[A-Z]/.test(form.password),             txt: '1 mayúscula'   },
                { ok: /[0-9]/.test(form.password),             txt: '1 número'      },
                { ok: /[!@#$%^&*()_\-+=]/.test(form.password), txt: '1 especial'    },
              ].map(({ ok, txt }) => (
                <span key={txt} style={{ color: ok ? 'var(--success)' : 'var(--text3)' }}>
                  {ok ? '✓' : '○'} {txt}
                </span>
              ))}
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || success}
              style={{ width:'100%', padding:'11px 20px', fontSize:'.9rem', borderRadius:12 }}
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:18, fontSize:'.82rem', color:'var(--text3)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color:'var(--accent)', fontWeight:600 }}>Inicia sesión</Link>
          </p>
        </div>

        {/* Nota de contraseña segura */}
        <p style={{ textAlign:'center', fontSize:'.72rem', color:'rgba(255,255,255,.35)', marginTop:14 }}>
          La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.
        </p>
      </div>
    </div>
  )
}
