import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { notificacionesApi } from '../api'
import { initials, fmtFecha } from '../utils/helpers'
import Modal from './Modal'

const NAV = {
  ESTUDIANTE: [
    { to: '/dashboard',     label: 'Dashboard',     Icon: IconGrid   },
    { to: '/convocatorias', label: 'Convocatorias', Icon: IconList   },
    { to: '/documentos',    label: 'Documentos',    Icon: IconUpload },
    { to: '/solicitudes',   label: 'Solicitudes',   Icon: IconFile   },
    { to: '/perfil',        label: 'Perfil',        Icon: IconUser   },
  ],
  EVALUADOR: [
    { to: '/dashboard',   label: 'Dashboard',   Icon: IconGrid },
    { to: '/solicitudes', label: 'Solicitudes', Icon: IconFile },
  ],
  ADMINISTRADOR: [
    { to: '/dashboard', label: 'Dashboard', Icon: IconGrid },
    { to: '/ranking',   label: 'Ranking',   Icon: IconStar },
  ],
  TESORERO: [
    { to: '/dashboard',    label: 'Dashboard',   Icon: IconGrid   },
    { to: '/desembolsos',  label: 'Desembolsos', Icon: IconDollar },
  ],
}

const ROL_LABEL = {
  ESTUDIANTE:    'Estudiante',
  EVALUADOR:     'Evaluador',
  ADMINISTRADOR: 'Administrador',
  TESORERO:      'Tesorería',
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const [notifCount, setNotifCount] = useState(0)
  const [notifOpen,  setNotifOpen]  = useState(false)
  const [notifs,     setNotifs]     = useState([])
  const location = useLocation()

  useEffect(() => { loadCount() }, [location.pathname])

  async function loadCount() {
    try {
      const r = await notificacionesApi.count()
      setNotifCount(r.data?.count ?? 0)
    } catch (_) {}
  }

  async function openNotif() {
    try {
      const r = await notificacionesApi.getMias()
      setNotifs(r.data ?? [])
      await notificacionesApi.marcarLeidas()
      setNotifCount(0)
      setNotifOpen(true)
    } catch (_) { toast.error('Error al cargar notificaciones') }
  }

  const nav = NAV[user?.rol] || []
  const ini = initials(user?.nombre || '')

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ background: '#fff', padding: 2, overflow: 'hidden' }}>
            <img
              src="/logo-itm.png"
              alt="ITM"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.parentElement.style.background = 'rgba(255,255,255,.15)'
                e.target.parentElement.innerHTML = '<span style="font-weight:800;font-size:.95rem">ITM</span>'
              }}
            />
          </div>
          <div>
            <div className="sidebar-logo-text">Sistema Becas</div>
            <div className="sidebar-logo-sub">ITM</div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{ini}</div>
          <div>
            <div className="sidebar-name">{user?.nombre}</div>
            <div className="sidebar-role">{ROL_LABEL[user?.rol]}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <item.Icon />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" style={{ width: '100%' }} onClick={logout}>
            <IconLogout /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Área principal */}
      <div className="main-area">
        <header className="topbar">
          <div style={{ flex: 1 }} />
          <button className="topbar-btn" onClick={openNotif} title="Notificaciones">
            <IconBell />
            {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
          </button>
          <div className="top-avatar">{ini}</div>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>

      {/* Modal notificaciones */}
      <Modal open={notifOpen} onClose={() => setNotifOpen(false)} title="Notificaciones">
        {notifs.length === 0
          ? <p style={{ textAlign: 'center', color: 'var(--text3)', padding: '20px 0' }}>No tienes notificaciones</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {notifs.map(n => (
                <div key={n.id} style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: n.leida ? 'var(--surface2)' : 'var(--bg)',
                  borderLeft: `3px solid ${n.leida ? 'var(--border)' : 'var(--accent)'}`,
                  fontSize: '.82rem',
                }}>
                  <strong style={{ color: 'var(--text1)' }}>{n.titulo}</strong>
                  <p style={{ color: 'var(--text2)', marginTop: 3 }}>{n.mensaje}</p>
                  <p style={{ color: 'var(--text3)', fontSize: '.72rem', marginTop: 3 }}>{fmtFecha(n.creadoEn)}</p>
                </div>
              ))}
            </div>
        }
      </Modal>
    </div>
  )
}

function IconGrid()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> }
function IconList()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> }
function IconUpload() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg> }
function IconFile()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
function IconUser()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function IconStar()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }
function IconDollar() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> }
function IconLogout() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg> }
function IconBell()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg> }
