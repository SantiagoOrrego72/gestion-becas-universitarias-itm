// ─── NOTIFICACION CONTROLLER ──────────────────────────────────
const svc = require('../services/notificacion.service');
const { ok, serverError } = require('../utils/response');

const getMias = async (req, res) => {
  try {
    const data = await svc.getMias(req.user.id);
    return ok(res, data);
  } catch (err) {
    return serverError(res);
  }
};

const marcarLeidas = async (req, res) => {
  try {
    await svc.marcarLeidas(req.user.id);
    return ok(res, {}, 'Notificaciones marcadas como leídas');
  } catch (err) {
    return serverError(res);
  }
};

const contarNoLeidas = async (req, res) => {
  try {
    const count = await svc.contarNoLeidas(req.user.id);
    return ok(res, { count });
  } catch (err) {
    return serverError(res);
  }
};

module.exports = { getMias, marcarLeidas, contarNoLeidas };
