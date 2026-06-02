// ─── NOTIFICACION SERVICE ─────────────────────────────────────
const prisma = require('../config/prisma');

const getMias = async (usuarioId) => {
  return prisma.notificacion.findMany({
    where: { usuarioId },
    orderBy: { creadoEn: 'desc' },
    take: 50,
  });
};

const marcarLeidas = async (usuarioId) => {
  await prisma.notificacion.updateMany({
    where: { usuarioId, leida: false },
    data: { leida: true },
  });
};

const contarNoLeidas = async (usuarioId) => {
  return prisma.notificacion.count({ where: { usuarioId, leida: false } });
};

module.exports = { getMias, marcarLeidas, contarNoLeidas };
