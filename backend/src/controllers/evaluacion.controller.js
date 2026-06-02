// ─── EVALUACION CONTROLLER ────────────────────────────────────
const svc = require('../services/evaluacion.service');
const { ok, created, serverError } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const data = await svc.getAll(req.user.id);
    return ok(res, data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const evaluar = async (req, res) => {
  try {
    const data = await svc.evaluar(req.params.solicitudId, req.body, req.user.id);
    return created(res, data, 'Evaluación registrada');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const actualizarEvaluacion = async (req, res) => {
  try {
    const data = await svc.actualizarEvaluacion(req.params.id, req.body, req.user.id);
    return ok(res, data, 'Evaluación actualizada');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

module.exports = { getAll, evaluar, actualizarEvaluacion };
