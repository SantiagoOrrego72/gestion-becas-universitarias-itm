// ─── EVALUACION SERVICE ───────────────────────────────────────
const prisma = require('../config/prisma');
const { EvaluacionContext, crearStrategy } = require('../patterns/evaluacion.strategy');
const { estadoSubject }                    = require('../patterns/estado.observer');

/**
 * Evaluar solicitud
 */
const evaluar = async (solicitudId, { puntaje, observacion, accion }, evaluadorId) => {
  const sol = await prisma.solicitudBeca.findUnique({
    where: { id: solicitudId },
    include: {
      evaluacion: true,
      estudiante: { include: { usuario: true } },
      convocatoria: true,
    },
  });

  if (!sol) throw { status: 404, message: 'Solicitud no encontrada' };
  if (sol.evaluacion) throw { status: 409, message: 'Esta solicitud ya fue evaluada. Usa PUT para actualizar.' };

  // STRATEGY: delega la decisión del estado a la estrategia correspondiente
  const context = new EvaluacionContext(crearStrategy(accion));
  const estado  = context.ejecutar(puntaje);

  // Crear evaluación
  const evaluacion = await prisma.evaluacion.create({
    data: { solicitudId, evaluadorId, puntaje, observacion },
  });

  // Actualizar estado de solicitud
  await prisma.solicitudBeca.update({
    where: { id: solicitudId },
    data: { estado, evaluadorId },
  });

  // Si aprobada → crear pago pendiente si no existe
  if (estado === 'APROBADO') {
    const pagoExiste = await prisma.pago.findUnique({ where: { solicitudId } });
    if (!pagoExiste) {
      await prisma.pago.create({
        data: {
          solicitudId,
          monto: sol.convocatoria.monto,
          cuentaBancaria: sol.estudiante.cuentaBancaria || null,
          estado: 'PENDIENTE',
        },
      });
      // Incrementar cupos usados
      await prisma.convocatoria.update({
        where: { id: sol.convocatoriaId },
        data: { cuposUsados: { increment: 1 } },
      });
    }
  }

  // OBSERVER: notifica a todos los observers suscritos (NotificacionObserver + AuditoriaObserver)
  const eventoEval = estado === 'APROBADO' ? 'SOLICITUD_APROBADA' : 'SOLICITUD_RECHAZADA';
  await estadoSubject.notificar(eventoEval, {
    usuarioId:          sol.estudiante.usuarioId,
    actorId:            evaluadorId,
    convocatoriaNombre: sol.convocatoria.nombre,
    puntaje,
    entidad:            'Evaluacion',
    entidadId:          evaluacion.id,
    detalle:            `Puntaje ${puntaje} — ${estado}`,
  });

  return { evaluacion, estadoSolicitud: estado };
};

/**
 * Actualizar evaluación existente
 */
const actualizarEvaluacion = async (evaluacionId, { puntaje, observacion, accion }, evaluadorId) => {
  const ev = await prisma.evaluacion.findUnique({
    where: { id: evaluacionId },
    include: {
      solicitud: { include: { estudiante: { include: { usuario: true } }, convocatoria: true } },
    },
  });
  if (!ev) throw { status: 404, message: 'Evaluación no encontrada' };

  let estado;
  if (accion === 'rechazar') estado = 'RECHAZADO';
  else if (puntaje >= 60) estado = 'APROBADO';
  else estado = 'RECHAZADO';

  const updated = await prisma.evaluacion.update({
    where: { id: evaluacionId },
    data: { puntaje, observacion, evaluadorId },
  });

  await prisma.solicitudBeca.update({
    where: { id: ev.solicitudId },
    data: { estado },
  });

  await prisma.notificacion.create({
    data: {
      usuarioId: ev.solicitud.estudiante.usuarioId,
      titulo: 'Evaluación actualizada',
      mensaje: `Tu solicitud para "${ev.solicitud.convocatoria.nombre}" fue re-evaluada. Nuevo puntaje: ${puntaje}/100.`,
    },
  });

  return { evaluacion: updated, estadoSolicitud: estado };
};

/**
 * Obtener todas las evaluaciones (evaluador)
 */
const getAll = async (evaluadorId) => {
  return prisma.evaluacion.findMany({
    where: { evaluadorId },
    include: {
      solicitud: {
        include: {
          estudiante: { include: { usuario: { select: { nombre: true, correo: true } } } },
          convocatoria: { select: { nombre: true, monto: true } },
        },
      },
    },
    orderBy: { fechaEval: 'desc' },
  });
};

module.exports = { evaluar, actualizarEvaluacion, getAll };
