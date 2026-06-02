// ─── CONVOCATORIA CONTROLLER ──────────────────────────────────
const svc = require('../services/convocatoria.service');
const { ok, created, serverError } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const data = await svc.getAll(req.query);
    return ok(res, data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const getById = async (req, res) => {
  try {
    const data = await svc.getById(req.params.id);
    return ok(res, data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const create = async (req, res) => {
  try {
    const data = await svc.create(req.body, req.user.id);
    return created(res, data, 'Convocatoria creada');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const update = async (req, res) => {
  try {
    const data = await svc.update(req.params.id, req.body, req.user.id);
    return ok(res, data, 'Convocatoria actualizada');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id, req.user.id);
    return ok(res, {}, 'Convocatoria eliminada');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const getRanking = async (req, res) => {
  try {
    const data = await svc.getRanking(req.params.id);
    return ok(res, data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const confirmarBeneficiarios = async (req, res) => {
  try {
    const { solicitudIds } = req.body;
    if (!Array.isArray(solicitudIds) || solicitudIds.length === 0) {
      return res.status(400).json({ ok: false, error: 'Debes enviar al menos un ID de solicitud' });
    }
    const data = await svc.confirmarBeneficiarios(solicitudIds, req.user.id);
    return ok(res, data, `${data.confirmados} beneficiarios confirmados`);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

module.exports = { getAll, getById, create, update, remove, getRanking, confirmarBeneficiarios };
