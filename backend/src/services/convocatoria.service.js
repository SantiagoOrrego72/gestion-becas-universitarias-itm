// ─── CONVOCATORIA SERVICE ─────────────────────────────────────
const prisma = require('../config/prisma');

// documentosRequeridos se almacena como JSON string (campo String? en schema)
const toDb = (data) => {
  const d = { ...data };
  if (Array.isArray(d.documentosRequeridos)) d.documentosRequeridos = JSON.stringify(d.documentosRequeridos);
  // Prisma requires full ISO-8601 DateTime; plain date strings (YYYY-MM-DD) cause errors
  if (d.fechaInicio && typeof d.fechaInicio === 'string') d.fechaInicio = new Date(d.fechaInicio);
  if (d.fechaFin    && typeof d.fechaFin    === 'string') d.fechaFin    = new Date(d.fechaFin);
  return d;
};
const fromDb = (conv) => {
  if (!conv) return conv;
  if (typeof conv.documentosRequeridos === 'string') {
    try { conv.documentosRequeridos = JSON.parse(conv.documentosRequeridos); } catch { conv.documentosRequeridos = []; }
  }
  return conv;
};

const getAll = async (filtros = {}) => {
  const { estado, page = 1, limit = 20 } = filtros;
  const where = {};
  if (estado) where.estado = estado;

  // Auto-close convocatorias whose fechaFin has passed (HU-04)
  await prisma.convocatoria.updateMany({
    where: { estado: 'ABIERTA', fechaFin: { lt: new Date() } },
    data:  { estado: 'CERRADA' },
  });

  const [items, total] = await Promise.all([
    prisma.convocatoria.findMany({
      where,
      orderBy: { fechaFin: 'asc' },
      skip: (page - 1) * limit,
      take: Number(limit),
    }),
    prisma.convocatoria.count({ where }),
  ]);

  return { items: items.map(fromDb), total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
};

const getById = async (id) => {
  const conv = await prisma.convocatoria.findUnique({
    where: { id },
    include: {
      solicitudes: {
        select: {
          id: true, estado: true,
          estudiante: { select: { usuario: { select: { nombre: true, correo: true } } } },
          evaluacion: { select: { puntaje: true } },
        },
      },
    },
  });
  if (!conv) throw { status: 404, message: 'Convocatoria no encontrada' };
  return fromDb(conv);
};

const create = async (data, usuarioId) => {
  const conv = await prisma.convocatoria.create({ data: toDb(data) });

  await prisma.auditoria.create({
    data: {
      usuarioId,
      accion: 'CREAR_CONVOCATORIA',
      entidad: 'Convocatoria',
      entidadId: conv.id,
      detalle: conv.nombre,
    },
  });

  return conv;
};

const update = async (id, data, usuarioId) => {
  const conv = await prisma.convocatoria.findUnique({ where: { id } });
  if (!conv) throw { status: 404, message: 'Convocatoria no encontrada' };

  const updated = await prisma.convocatoria.update({ where: { id }, data: toDb(data) });

  await prisma.auditoria.create({
    data: { usuarioId, accion: 'EDITAR_CONVOCATORIA', entidad: 'Convocatoria', entidadId: id, detalle: updated.nombre },
  });

  return updated;
};

const remove = async (id, usuarioId) => {
  const conv = await prisma.convocatoria.findUnique({ where: { id } });
  if (!conv) throw { status: 404, message: 'Convocatoria no encontrada' };

  // HU-04: No se permite eliminar convocatorias con postulaciones registradas (solo desactivar)
  const totalSolicitudes = await prisma.solicitudBeca.count({ where: { convocatoriaId: id } });
  if (totalSolicitudes > 0) throw { status: 409, message: 'No se puede eliminar una convocatoria que ya tiene postulaciones registradas. Puedes cerrarla (desactivarla) en su lugar.' };

  await prisma.convocatoria.delete({ where: { id } });

  await prisma.auditoria.create({
    data: { usuarioId, accion: 'ELIMINAR_CONVOCATORIA', entidad: 'Convocatoria', entidadId: id, detalle: conv.nombre },
  });
};

const getRanking = async (convocatoriaId) => {
  const solicitudes = await prisma.solicitudBeca.findMany({
    where: { convocatoriaId },
    include: {
      estudiante: { include: { usuario: { select: { nombre: true, correo: true } } } },
      evaluacion: true,
    },
    orderBy: { evaluacion: { puntaje: 'desc' } },
  });
  return solicitudes;
};

const confirmarBeneficiarios = async (solicitudIds, adminId) => {
  const results = [];

  for (const solId of solicitudIds) {
    const sol = await prisma.solicitudBeca.findUnique({
      where: { id: solId },
      include: {
        convocatoria: true,
        evaluacion: true,
        estudiante: { include: { usuario: true } },
      },
    });

    if (!sol) continue;
    if (!sol.evaluacion) throw { status: 400, message: `La solicitud ${solId} aún no ha sido evaluada` };
    if (sol.estado === 'RECHAZADO') throw { status: 400, message: `La solicitud ${solId} fue rechazada, no puede confirmarse` };

    // Verificar cupos disponibles
    const conv = sol.convocatoria;
    if (conv.cuposUsados >= conv.cuposTotal) {
      throw { status: 409, message: `La convocatoria "${conv.nombre}" ya no tiene cupos disponibles` };
    }

    // Actualizar solicitud
    await prisma.solicitudBeca.update({ where: { id: solId }, data: { estado: 'APROBADO' } });

    // Actualizar cupos
    await prisma.convocatoria.update({
      where: { id: conv.id },
      data: { cuposUsados: { increment: 1 } },
    });

    // Crear pago pendiente si no existe
    const pagoExiste = await prisma.pago.findUnique({ where: { solicitudId: solId } });
    if (!pagoExiste) {
      await prisma.pago.create({
        data: {
          solicitudId: solId,
          monto: conv.monto,
          cuentaBancaria: sol.estudiante.cuentaBancaria || null,
          estado: 'PENDIENTE',
        },
      });
    }

    // Notificación al estudiante
    await prisma.notificacion.create({
      data: {
        usuarioId: sol.estudiante.usuarioId,
        titulo: '¡Beca aprobada!',
        mensaje: `Has sido seleccionado como beneficiario de "${conv.nombre}". El desembolso será procesado próximamente.`,
      },
    });

    results.push(solId);
  }

  await prisma.auditoria.create({
    data: {
      usuarioId: adminId,
      accion: 'CONFIRMAR_BENEFICIARIOS',
      entidad: 'SolicitudBeca',
      detalle: `${results.length} beneficiarios confirmados`,
    },
  });

  return { confirmados: results.length };
};

module.exports = { getAll, getById, create, update, remove, getRanking, confirmarBeneficiarios };
