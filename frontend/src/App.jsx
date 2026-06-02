import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/Layout'

// Auth pages
import Login    from './pages/Login'
import Register from './pages/Register'

// Estudiante
import EstDashboard    from './pages/estudiante/Dashboard'
import EstConvocatorias from './pages/estudiante/Convocatorias'
import EstDocumentos   from './pages/estudiante/Documentos'
import EstSolicitudes  from './pages/estudiante/Solicitudes'
import EstPerfil       from './pages/estudiante/Perfil'

// Evaluador
import EvalDashboard   from './pages/evaluador/Dashboard'
import EvalSolicitudes from './pages/evaluador/Solicitudes'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminRanking   from './pages/admin/Ranking'

// Tesorería
import TesDashboard   from './pages/tesoreria/Dashboard'
import TesDesembolsos from './pages/tesoreria/Desembolsos'

// ─── RUTAS POR ROL ────────────────────────────────────────────

const ROLE_ROUTES = {
  ESTUDIANTE: [
    { path: '/dashboard',     element: <EstDashboard />     },
    { path: '/convocatorias', element: <EstConvocatorias /> },
    { path: '/documentos',    element: <EstDocumentos />    },
    { path: '/solicitudes',   element: <EstSolicitudes />   },
    { path: '/perfil',        element: <EstPerfil />        },
  ],
  EVALUADOR: [
    { path: '/dashboard',   element: <EvalDashboard />   },
    { path: '/solicitudes', element: <EvalSolicitudes /> },
  ],
  ADMINISTRADOR: [
    { path: '/dashboard', element: <AdminDashboard /> },
    { path: '/ranking',   element: <AdminRanking />   },
  ],
  TESORERO: [
    { path: '/dashboard',  element: <TesDashboard />   },
    { path: '/desembolsos',element: <TesDesembolsos /> },
  ],
}

// ─── RUTAS PROTEGIDAS ─────────────────────────────────────────

function ProtectedRoutes() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  const routes = ROLE_ROUTES[user.rol] || []

  return (
    <Layout>
      <Routes>
        {routes.map(r => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
        {/* Default redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

// ─── APP ──────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>}    />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/*"        element={<ProtectedRoutes />}                     />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
