// ─── AUTH CONTROLLER ──────────────────────────────────────────
const authService = require('../services/auth.service');
const { ok, created, serverError } = require('../utils/response');

const register = async (req, res) => {
  try {
    const data = await authService.register(req.body);
    return created(res, data, 'Registro exitoso');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const login = async (req, res) => {
  try {
    const data = await authService.login(req.body);
    return ok(res, data, 'Login exitoso');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const getProfile = async (req, res) => {
  try {
    const data = await authService.getProfile(req.user.id);
    return ok(res, data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const updateProfile = async (req, res) => {
  try {
    const data = await authService.updateProfile(req.user.id, req.body);
    return ok(res, data, 'Perfil actualizado');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const changePassword = async (req, res) => {
  try {
    const data = await authService.changePassword(req.user.id, req.body);
    return ok(res, data, 'Contraseña actualizada');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

module.exports = { register, login, getProfile, updateProfile, changePassword };
