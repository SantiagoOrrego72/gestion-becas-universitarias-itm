// ─── MIDDLEWARE DE ROLES Y PERMISOS ───────────────────────────
const { forbidden } = require('../utils/response');

/**
 * allowRoles('ADMINISTRADOR', 'EVALUADOR')
 * Permite el acceso solo a los roles indicados.
 */
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) return forbidden(res, 'No autenticado');
  if (!roles.includes(req.user.rol)) {
    return forbidden(res, `Acceso denegado. Se requiere rol: ${roles.join(' o ')}`);
  }
  next();
};

module.exports = { allowRoles };
