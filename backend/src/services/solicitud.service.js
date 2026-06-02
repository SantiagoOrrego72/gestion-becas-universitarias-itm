// ─── SOLICITUD SERVICE ────────────────────────────────────────
const prisma = require('../config/prisma');
const { PostulacionBecaImpl } = require('../patterns/postulacion.template');

// Instancia reutilizable del template concreto
const postulacionTemplate = new PostulacionBecaImpl();

// Parse documentosRequeridos JSON string on nested convocatoria objects
const parseConvDocumentos = (sol) => {
  if (sol?.convocatoria && typeof sol.convocatoria.documentosRequeridos === 'string') {
    try { sol.convocatoria.documentosRequeridos = JSON.parse(sol.convocatoria.documentosRequeridos); }
    catch { sol.convocatoria.documentosRequeridos = []; }
  }
  return sol;
};

/**
 * Obtener solicitudes (con filtros según rol)
 */
const getAll = async ({ rol, usuarioId, convocatoriaId, estado } = {}) => {
  const where = {};

  if (convocatoriaId) where.convocatoriaId = convocatoriaId;
  if (estado) where.estado = estado;

  // Estudiante solo ve sus propias solicitudes
  if (rol === 'ESTUDIANTE') {
    const est = await prisma.estudiante.findUnique({ where: { usuarioId } });
    if (!est) return [];
    where.estudianteId = est.id;
  }

  const solicitudes = await prisma.solicitudBeca.findMany({
    where,
    include: {
      estudiante: { include: { usuario: { select: { nombre: true, correo: true } } } },
      convocatoria: { select: { id: true, nombre: true, monto: true, documentosRequeridos: true, requisitos: true } },
      evaluacion: true,
      pago: true,
      documentos: true,
    },
    orderBy: { fechaEnvio: 'desc' },
  });

  return solicitudes.map(parseConvDocumentos);
};

/**
 * Obtener una solicitud por ID
 */
const getById = async (id, { rol, usuarioId } = {}) => {
  const sol = await prisma.solicitudBeca.findUnique({
    where: { id },
    include: {
      estudiante: { include: { usuario: { select: { nombre: true, correo: true } } } },
      convocatoria: true,
      evaluacion: { include: { evaluador: { select: { nombre: true } } } },
      pago: true,
      documentos: true,
    },
  });

  if (!sol) throw { status: 404, message: 'Solicitud no encontrada' };

  // Verificar que el estudiante solo vea sus propias solicitudes
  if (rol === 'ESTUDIANTE') {
    const est = await prisma.estudiante.findUnique({ where: { usuarioId } });
    if (sol.estudianteId !== est?.id) throw { status: 403, message: 'Acceso denegado' };
  }

  return parseConvDocumentos(sol);
};

/**
 * Crear nueva solicitud (estudiante)
 */
const create = async ({ convocatoriaId, cartaMotivacion }, usuarioId) => {
  // TEMPLATE METHOD: el algoritmo completo (validar → crear → notificar → auditar)
  // está definido en PostulacionTemplate.postular(); esta función solo orquesta la llamada.
  return postulacionTemplate.postular(convocatoriaId, cartaMotivacion, usuarioId);
};

/**
 * Actualizar estado de solicitud (admin)
 */
const updateEstado = async (id, estado, adminId) => {
  const sol = await prisma.solicitudBeca.update({
    where: { id },
    data: { estado },
  });

  await prisma.auditoria.create({
    data: { usuarioId: adminId, accion: `CAMBIAR_ESTADO_${estado}`, entidad: 'SolicitudBeca', entidadId: id },
  });

  return sol;
};

module.exports = { getAll, getById, create, updateEstado };
