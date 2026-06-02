// ══════════════════════════════════════════════════════════════
//  TEMPLATE METHOD — Flujo de postulación
//
//  Problema: toda postulación sigue los mismos pasos (verificar
//  estudiante → validar convocatoria → verificar cupos → evitar
//  duplicados → crear solicitud → notificar). Template Method
//  define ese esqueleto en la clase base; subclases pueden
//  sobreescribir pasos específicos sin romper el flujo general.
//
//  Participantes:
//    - PostulacionTemplate      → Abstract Class (template method)
//    - PostulacionBecaImpl      → Concrete Class (implementación real)
// ══════════════════════════════════════════════════════════════

const prisma = require('../config/prisma');

// ─── Clase abstracta ─────────────────────────────────────────
class PostulacionTemplate {
  /**
   * Template Method: define el algoritmo completo.
   * No debe sobreescribirse — orquesta los pasos en orden.
   */
  async postular(convocatoriaId, cartaMotivacion, usuarioId) {
    const estudiante    = await this.obtenerEstudiante(usuarioId);
    const convocatoria  = await this.obtenerConvocatoria(convocatoriaId);

    this.validarEstadoConvocatoria(convocatoria);
    this.validarFechaVigencia(convocatoria);
    this.validarCuposDisponibles(convocatoria);
    await this.verificarDuplicado(estudiante.id, convocatoriaId);

    const solicitud = await this.crearSolicitud({
      estudianteId: estudiante.id,
      convocatoriaId,
      cartaMotivacion,
    });

    await this.notificar(usuarioId, convocatoria.nombre, solicitud.id);
    await this.registrarAuditoria(usuarioId, convocatoria.nombre, solicitud.id);

    return solicitud;
  }

  // ─── Pasos que las subclases pueden sobreescribir ────────────

  async obtenerEstudiante(usuarioId) {
    const est = await prisma.estudiante.findUnique({ where: { usuarioId } });
    if (!est) throw { status: 404, message: 'Perfil de estudiante no encontrado' };
    return est;
  }

  async obtenerConvocatoria(convocatoriaId) {
    const conv = await prisma.convocatoria.findUnique({ where: { id: convocatoriaId } });
    if (!conv) throw { status: 404, message: 'Convocatoria no encontrada' };
    return conv;
  }

  validarEstadoConvocatoria(convocatoria) {
    if (convocatoria.estado !== 'ABIERTA') {
      throw { status: 400, message: 'La convocatoria no está abierta' };
    }
  }

  validarFechaVigencia(convocatoria) {
    if (new Date() > new Date(convocatoria.fechaFin)) {
      throw { status: 400, message: 'La convocatoria ha vencido' };
    }
  }

  validarCuposDisponibles(convocatoria) {
    if (convocatoria.cuposUsados >= convocatoria.cuposTotal) {
      throw { status: 409, message: 'No hay cupos disponibles en esta convocatoria' };
    }
  }

  async verificarDuplicado(estudianteId, convocatoriaId) {
    const existe = await prisma.solicitudBeca.findUnique({
      where: { estudianteId_convocatoriaId: { estudianteId, convocatoriaId } },
    });
    if (existe) throw { status: 409, message: 'Ya has postulado a esta convocatoria' };
  }

  async crearSolicitud({ estudianteId, convocatoriaId, cartaMotivacion }) {
    return prisma.solicitudBeca.create({
      data: { estudianteId, convocatoriaId, cartaMotivacion, estado: 'EN_REVISION' },
      include: { convocatoria: { select: { nombre: true } } },
    });
  }

  async notificar(usuarioId, convocatoriaNombre, _solicitudId) {
    await prisma.notificacion.create({
      data: {
        usuarioId,
        titulo:  'Solicitud recibida',
        mensaje: `Tu solicitud para "${convocatoriaNombre}" fue recibida. Estado: En revisión.`,
      },
    });
  }

  async registrarAuditoria(usuarioId, convocatoriaNombre, solicitudId) {
    await prisma.auditoria.create({
      data: {
        usuarioId,
        accion:    'CREAR_SOLICITUD',
        entidad:   'SolicitudBeca',
        entidadId: solicitudId,
        detalle:   `Postulación a "${convocatoriaNombre}"`,
      },
    });
  }
}

// ─── Implementación concreta ──────────────────────────────────
// Hereda todos los pasos y solo sobreescribe la inclusión de
// la respuesta con datos anidados para el frontend.
class PostulacionBecaImpl extends PostulacionTemplate {
  async crearSolicitud({ estudianteId, convocatoriaId, cartaMotivacion }) {
    return prisma.solicitudBeca.create({
      data: { estudianteId, convocatoriaId, cartaMotivacion, estado: 'EN_REVISION' },
      include: {
        convocatoria: { select: { nombre: true, monto: true } },
      },
    });
  }
}

module.exports = { PostulacionTemplate, PostulacionBecaImpl };
