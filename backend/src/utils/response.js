// ─── HELPERS DE RESPUESTA HTTP ────────────────────────────────

const ok = (res, data = {}, message = 'OK', status = 200) =>
  res.status(status).json({ ok: true, message, data });

const created = (res, data = {}, message = 'Recurso creado') =>
  res.status(201).json({ ok: true, message, data });

const badRequest = (res, message = 'Solicitud inválida', errors = null) =>
  res.status(400).json({ ok: false, error: message, ...(errors && { errors }) });

const unauthorized = (res, message = 'No autorizado') =>
  res.status(401).json({ ok: false, error: message });

const forbidden = (res, message = 'Acceso denegado') =>
  res.status(403).json({ ok: false, error: message });

const notFound = (res, message = 'Recurso no encontrado') =>
  res.status(404).json({ ok: false, error: message });

const conflict = (res, message = 'Conflicto con el estado actual') =>
  res.status(409).json({ ok: false, error: message });

const serverError = (res, message = 'Error interno del servidor') =>
  res.status(500).json({ ok: false, error: message });

module.exports = { ok, created, badRequest, unauthorized, forbidden, notFound, conflict, serverError };
