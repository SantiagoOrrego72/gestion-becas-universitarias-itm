// ─── SOLICITUD CONTROLLER ─────────────────────────────────────
const svc = require('../services/solicitud.service');
const { ok, created, serverError } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const data = await svc.getAll({ rol: req.user.rol, usuarioId: req.user.id, ...req.query });
    return ok(res, data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const getById = async (req, res) => {
  try {
    const data = await svc.getById(req.params.id, { rol: req.user.rol, usuarioId: req.user.id });
    return ok(res, data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const create = async (req, res) => {
  try {
    const data = await svc.create(req.body, req.user.id);
    return created(res, data, 'Solicitud enviada exitosamente');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const updateEstado = async (req, res) => {
  try {
    const data = await svc.updateEstado(req.params.id, req.body.estado, req.user.id);
    return ok(res, data, 'Estado actualizado');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

module.exports = { getAll, getById, create, updateEstado };
