import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('becas_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize error shape
api.interceptors.response.use(
  (res) => res.data.data !== undefined ? { ...res, data: res.data.data } : res,
  (err) => {
    const msg = err.response?.data?.error || 'Error en la solicitud'
    return Promise.reject({ status: err.response?.status, message: msg, errors: err.response?.data?.errors })
  }
)

// ─── AUTH ────────────────────────────────────────────────────

export const authApi = {
  login:           (correo, password)                      => api.post('/auth/login', { correo, password }),
  register:        (data)                                  => api.post('/auth/register', data),
  me:              ()                                      => api.get('/auth/me'),
  updateProfile:   (data)                                  => api.put('/auth/me', data),
  changePassword:  (passwordActual, passwordNueva)         => api.put('/auth/me/password', { passwordActual, passwordNueva }),
}

// ─── CONVOCATORIAS ───────────────────────────────────────────

export const convocatoriasApi = {
  getAll:         (params = {}) => api.get('/convocatorias', { params }),
  getById:        (id)          => api.get(`/convocatorias/${id}`),
  create:         (data)        => api.post('/convocatorias', data),
  update:         (id, data)    => api.put(`/convocatorias/${id}`, data),
  delete:         (id)          => api.delete(`/convocatorias/${id}`),
  getRanking:     (id)          => api.get(`/convocatorias/${id}/ranking`),
  confirmarBenef: (ids)         => api.post('/convocatorias/beneficiarios/confirmar', { solicitudIds: ids }),
}

// ─── SOLICITUDES ─────────────────────────────────────────────

export const solicitudesApi = {
  getAll:       (params = {}) => api.get('/solicitudes', { params }),
  getById:      (id)          => api.get(`/solicitudes/${id}`),
  create:       (data)        => api.post('/solicitudes', data),
  updateEstado: (id, estado)  => api.patch(`/solicitudes/${id}/estado`, { estado }),
}

// ─── DOCUMENTOS ──────────────────────────────────────────────

export const documentosApi = {
  getMios:        ()               => api.get('/documentos'),
  getBySolicitud: (solId)          => api.get(`/documentos/solicitud/${solId}`),
  upload:         (tipo, file, solicitudId = null) => {
    const fd = new FormData()
    fd.append('archivo', file)
    fd.append('tipo', tipo)
    if (solicitudId) fd.append('solicitudId', solicitudId)
    return api.post('/documentos/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  verificar:      (id, estado)     => api.patch(`/documentos/${id}/verificar`, { estado }),
  delete:         (id)             => api.delete(`/documentos/${id}`),
  fileUrl:        (id)             => {
    const token = localStorage.getItem('becas_token')
    return `/api/documentos/${id}/file${token ? '?token=' + encodeURIComponent(token) : ''}`
  },
}

// ─── EVALUACIONES ────────────────────────────────────────────

export const evaluacionesApi = {
  getAll:    ()             => api.get('/evaluaciones'),
  evaluar:   (solId, data)  => api.post(`/evaluaciones/solicitud/${solId}`, data),
  actualizar:(id, data)     => api.put(`/evaluaciones/${id}`, data),
}

// ─── PAGOS ───────────────────────────────────────────────────

export const pagosApi = {
  getAll:     (params = {}) => api.get('/pagos', { params }),
  getHistorial:()           => api.get('/pagos/historial'),
  confirmar:  (id, data)    => api.put(`/pagos/${id}/confirmar`, data),
}

// ─── NOTIFICACIONES ──────────────────────────────────────────

export const notificacionesApi = {
  getMias:      () => api.get('/notificaciones'),
  count:        () => api.get('/notificaciones/count'),
  marcarLeidas: () => api.patch('/notificaciones/leer', {}),
}
