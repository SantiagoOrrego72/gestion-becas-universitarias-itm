// ─── MIDDLEWARE GLOBAL DE ERRORES ─────────────────────────────
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id || 'anónimo',
  });

  // Errores de Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({ ok: false, error: 'Ya existe un registro con esos datos únicos' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ ok: false, error: 'Registro no encontrado' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    ok: false,
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ ok: false, error: `Ruta ${req.method} ${req.path} no encontrada` });
};

module.exports = { errorHandler, notFoundHandler };
