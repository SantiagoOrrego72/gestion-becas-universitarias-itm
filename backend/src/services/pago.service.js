// ─── PAGO SERVICE ─────────────────────────────────────────────
const prisma = require('../config/prisma');

/**
 * Listar pagos (tesorería)
 */
const getAll = async ({ estado } = {}) => {
  const where = {};
  if (estado) where.estado = estado;

  return prisma.pago.findMany({
    where,
    include: {
      solicitud: {
        include: {
          estudiante: { include: { usuario: { select: { nombre: true, correo: true } } } },
          convocatoria: { select: { nombre: true, monto: true } },
        },
      },
    },
    orderBy: { creadoEn: 'desc' },
  });
};

/**
 * Confirmar desembolso
 */
const confirmar = async (pagoId, { numeroTransaccion, fechaPago, cuentaBancaria }, tesoreroId) => {
  const pago = await prisma.pago.findUnique({
    where: { id: pagoId },
    include: {
      solicitud: {
        include: {
          estudiante: { include: { usuario: true } },
          convocatoria: { select: { nombre: true } },
        },
      },
    },
  });

  if (!pago) throw { status: 404, message: 'Pago no encontrado' };
  if (pago.estado === 'COMPLETADO') throw { status: 409, message: 'Este desembolso ya fue procesado' };
  // HU-08: Solo solicitudes en estado APROBADO pueden desembolsarse
  if (pago.solicitud.estado !== 'APROBADO') {
    throw { status: 400, message: `No se puede desembolsar: la solicitud está en estado "${pago.solicitud.estado}". Solo se pueden desembolsar solicitudes APROBADAS.` };
  }

  // HU-08: El número de transacción debe ser único en el sistema
  const txnExiste = await prisma.pago.findFirst({
    where: { numeroTransaccion, id: { not: pagoId } },
  });
  if (txnExiste) throw { status: 409, message: `El número de transacción "${numeroTransaccion}" ya fue registrado en otro desembolso` };

  const updated = await prisma.pago.update({
    where: { id: pagoId },
    data: {
      numeroTransaccion,
      fechaPago: new Date(fechaPago),
      cuentaBancaria: cuentaBancaria || pago.cuentaBancaria,
      estado: 'COMPLETADO',
    },
  });

  // Actualizar solicitud a DESEMBOLSADO
  await prisma.solicitudBeca.update({
    where: { id: pago.solicitudId },
    data: { estado: 'DESEMBOLSADO' },
  });

  // Notificar al estudiante
  await prisma.notificacion.create({
    data: {
      usuarioId: pago.solicitud.estudiante.usuarioId,
      titulo: '💳 Beca desembolsada',
      mensaje: `El pago de tu beca "${pago.solicitud.convocatoria.nombre}" fue procesado. N° transacción: ${numeroTransaccion}. Monto: $${pago.monto.toLocaleString('es-CO')}`,
    },
  });

  await prisma.auditoria.create({
    data: {
      usuarioId: tesoreroId,
      accion: 'CONFIRMAR_DESEMBOLSO',
      entidad: 'Pago',
      entidadId: pagoId,
      detalle: `TXN: ${numeroTransaccion}`,
    },
  });

  return updated;
};

/**
 * Historial completo de pagos
 */
const getHistorial = async () => {
  return prisma.pago.findMany({
    include: {
      solicitud: {
        include: {
          estudiante: { include: { usuario: { select: { nombre: true, correo: true } } } },
          convocatoria: { select: { nombre: true } },
        },
      },
    },
    orderBy: [{ estado: 'asc' }, { creadoEn: 'desc' }],
  });
};

module.exports = { getAll, confirmar, getHistorial };
