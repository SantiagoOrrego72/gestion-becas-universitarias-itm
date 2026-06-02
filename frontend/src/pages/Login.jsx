import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../context/AuthContext'

const TEST_USERS = [
  { rol: 'Estudiante',    correo: 'estudiante@itm.edu', password: 'Est1234',   color: '#3B82F6' },
  { rol: 'Evaluador',     correo: 'evaluador@itm.edu',  password: 'Eval1234',  color: '#8B5CF6' },
  { rol: 'Administrador', correo: 'admin@itm.edu',       password: 'Admin1234', color: '#10B981' },
  { rol: 'Tesorero',      correo: 'tesoreria@itm.edu',  password: 'Tes1234',   color: '#F59E0B' },
]

export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const bgRef      = useRef(null)

  const [correo,   setCorreo]   = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [glow,     setGlow]     = useState({ x: 50, y: 50 })

  const onMouseMove = useCallback((e) => {
    const rect = bgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width)  * 100
    const y = ((e.clientY - rect.top)  / rect.height) * 100
    setGlow({ x, y })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!correo || !password) { setError('Completa todos los campos.'); return }
    setLoading(true)
    try {
      const res = await authApi.login(correo, password)
      login(res.data.token, res.data.usuario)
      setAttempts(0)
      navigate('/dashboard')
    } catch (err) {
      const next = attempts + 1
      setAttempts(next)
      setError(next >= 3
        ? 'Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta de nuevo en 15 minutos.'
        : err.message || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  function fillUser(u) {
    setCorreo(u.correo)
    setPassword(u.password)
    setError('')
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
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `radial-gradient(
          600px circle at ${glow.x}% ${glow.y}%,
          rgba(99, 179, 255, 0.18) 0%,
          rgba(59, 130, 246, 0.08) 40%,
          transparent 70%
        )`,
        transition: 'background 0.05s ease',
        zIndex: 0,
      }} />

      {/* Círculos decorativos de fondo */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-80px',
        width: 400, height: 400, borderRadius: '50%',
        background: 'rgba(99, 179, 255, 0.06)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-60px',
        width: 300, height: 300, borderRadius: '50%',
        background: 'rgba(139, 92, 246, 0.07)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Contenido */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 100, height: 100,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
            boxShadow: '0 0 0 3px rgba(255,255,255,0.2), 0 8px 32px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}>
            <img
              src="/logo-itm.png"
              alt="Logo ITM"
              style={{ width: '88%', height: '88%', objectFit: 'contain' }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = '<span style="font-size:2rem;font-weight:800;color:#1e3a8a">ITM</span>'
              }}
            />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            Sistema de Becas
          </div>
          <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
            Instituto Tecnológico Metropolitano
          </div>
        </div>

        {/* Card login */}
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 20,
          padding: '36px 40px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24, color: '#0f172a' }}>
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Correo institucional</label>
              <input className="input" type="email" placeholder="usuario@itm.edu.co"
                value={correo} onChange={e => setCorreo(e.target.value)} autoFocus
                style={{ fontSize: '.9rem', padding: '10px 14px' }} />
            </div>

            <div className="form-group">
              <label className="label">Contraseña</label>
              <input className="input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                style={{ fontSize: '.9rem', padding: '10px 14px' }} />
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16, fontSize: '.82rem' }}>{error}</div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', padding: '11px 20px', fontSize: '.9rem', marginTop: 4, borderRadius: 12 }}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: '.82rem', color: 'var(--text3)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Regístrate aquí</Link>
          </p>
        </div>

        {/* Credenciales de prueba */}
        <div style={{ marginTop: 20 }}>
          <p style={{ textAlign: 'center', fontSize: '.76rem', color: 'rgba(255,255,255,0.45)', marginBottom: 10, letterSpacing: '.05em', textTransform: 'uppercase' }}>
            Usuarios de prueba
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TEST_USERS.map(u => (
              <button
                key={u.rol}
                onClick={() => fillUser(u)}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background .15s, transform .1s',
                  backdropFilter: 'blur(4px)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.13)'
                  e.currentTarget.style.transform  = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.transform  = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: u.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '.76rem', fontWeight: 700, color: '#fff' }}>{u.rol}</span>
                </div>
                <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                  {u.correo}<br />
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>{u.password}</span>
                </div>
              </button>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
            Haz clic en un usuario para autocompletar el formulario
          </p>
        </div>

      </div>
    </div>
  )
}
