// ─── PAGO CONTROLLER ──────────────────────────────────────────
const svc = require('../services/pago.service');
const { ok, serverError } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const data = await svc.getAll(req.query);
    return ok(res, data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const getHistorial = async (req, res) => {
  try {
    const data = await svc.getHistorial();
    return ok(res, data);
  } catch (err) {
    return serverError(res);
  }
};

const confirmar = async (req, res) => {
  try {
    const data = await svc.confirmar(req.params.id, req.body, req.user.id);
    return ok(res, data, 'Desembolso confirmado exitosamente');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

module.exports = { getAll, getHistorial, confirmar };
