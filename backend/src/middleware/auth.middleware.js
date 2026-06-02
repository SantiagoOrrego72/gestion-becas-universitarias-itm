// ─── MIDDLEWARE DE AUTENTICACIÓN JWT ─────────────────────────
const { verify } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');
const prisma = require('../config/prisma');

const authenticate = async (req, res, next) => {
  // Acepta token desde el header Authorization O desde el query param ?token=
  // (el query param se usa para enlaces directos de descarga de archivos)
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return unauthorized(res, 'Token de acceso requerido');
  }
  const { valid, decoded, error } = verify(token);

  if (!valid) {
    const msg = error === 'jwt expired' ? 'Token expirado' : 'Token inválido';
    return unauthorized(res, msg);
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: { id: true, correo: true, nombre: true, rol: true, activo: true },
    });

    if (!usuario || !usuario.activo) {
      return unauthorized(res, 'Usuario no encontrado o desactivado');
    }

    req.user = usuario;
    next();
  } catch (err) {
    return unauthorized(res, 'Error al verificar usuario');
  }
};

module.exports = { authenticate };
