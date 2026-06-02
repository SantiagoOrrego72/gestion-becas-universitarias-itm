// ─── DOCUMENTO CONTROLLER ─────────────────────────────────────
const svc = require('../services/documento.service');
const { ok, created, serverError } = require('../utils/response');

const getMios = async (req, res) => {
  try {
    const data = await svc.getMios(req.user.id);
    return ok(res, data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const getBySolicitud = async (req, res) => {
  try {
    const data = await svc.getBySolicitud(req.params.solicitudId);
    return ok(res, data);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'No se recibió ningún archivo' });
    const data = await svc.upload(req.body, req.file, req.user.id);
    return created(res, data, 'Documento subido exitosamente');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const getFile = async (req, res) => {
  try {
    const { rutaArchivo, nombre, mimeType } = await svc.getFile(req.params.id, req.user.id, req.user.rol);
    res.setHeader('Content-Disposition', `inline; filename="${nombre}"`);
    res.setHeader('Content-Type', mimeType);
    res.sendFile(require('path').resolve(rutaArchivo));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const verificar = async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['VERIFICADO', 'RECHAZADO'].includes(estado)) {
      return res.status(400).json({ ok: false, error: 'Estado inválido' });
    }
    const data = await svc.verificar(req.params.id, estado, req.user.id);
    return ok(res, data, 'Documento actualizado');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id, req.user.id);
    return ok(res, {}, 'Documento eliminado');
  } catch (err) {
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    return serverError(res);
  }
};

module.exports = { getMios, getBySolicitud, upload, getFile, verificar, remove };
