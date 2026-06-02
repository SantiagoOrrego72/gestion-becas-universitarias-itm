// ══════════════════════════════════════════════════════════════
//  OBSERVER — Notificaciones por cambio de estado
//
//  Problema: cuando cambia el estado de una solicitud, varios
//  subsistemas deben reaccionar (crear notificación, registrar
//  auditoría). Con Observer el Subject emite el evento y los
//  Observers reaccionan de forma desacoplada.
//
//  Participantes:
//    - EstadoSubject        → Subject (emite cambios de estado)
//    - EstadoObserver       → interfaz Observer
//    - NotificacionObserver → Concrete Observer (BD)
//    - AuditoriaObserver    → Concrete Observer (BD)
// ══════════════════════════════════════════════════════════════

const prisma = require('../config/prisma');

// ─── Interfaz Observer ────────────────────────────────────────
class EstadoObserver {
  /**
   * @param {string} evento  Nombre del evento (ej. 'SOLICITUD_APROBADA')
   * @param {object} payload Datos del evento
   */
  async actualizar(evento, payload) {
    throw new Error(`${this.constructor.name} debe implementar actualizar()`);
  }
}

// ─── Concrete Observer: Notificación ──────────────────────────
class NotificacionObserver extends EstadoObserver {
  async actualizar(evento, payload) {
    const mensajes = {
      SOLICITUD_EN_REVISION: {
        titulo: 'Solicitud recibida',
        mensaje: `Tu solicitud para "${payload.convocatoriaNombre}" fue recibida. Estado: En revisión.`,
      },
      SOLICITUD_APROBADA: {
        titulo: '¡Solicitud aprobada! ✓',
        mensaje: `Tu solicitud para "${payload.convocatoriaNombre}" fue APROBADA. Puntaje: ${payload.puntaje}/100.`,
      },
      SOLICITUD_RECHAZADA: {
        titulo: 'Solicitud rechazada',
        mensaje: `Tu solicitud para "${payload.convocatoriaNombre}" fue rechazada. Puntaje: ${payload.puntaje}/100.`,
      },
      SOLICITUD_DESEMBOLSADA: {
        titulo: '💳 Beca desembolsada',
        mensaje: `El pago de tu beca "${payload.convocatoriaNombre}" fue procesado. N° transacción: ${payload.numeroTransaccion}.`,
      },
      DOCUMENTO_VERIFICADO: {
        titulo: 'Documento verificado ✓',
        mensaje: `Tu documento "${payload.tipoDocumento}" fue verificado exitosamente.`,
      },
      DOCUMENTO_RECHAZADO: {
        titulo: 'Documento rechazado',
        mensaje: `Tu documento "${payload.tipoDocumento}" fue rechazado. Por favor súbelo de nuevo.`,
      },
    };

    const msg = mensajes[evento];
    if (!msg || !payload.usuarioId) return;

    await prisma.notificacion.create({
      data: { usuarioId: payload.usuarioId, titulo: msg.titulo, mensaje: msg.mensaje },
    });
  }
}

// ─── Concrete Observer: Auditoría ─────────────────────────────
class AuditoriaObserver extends EstadoObserver {
  async actualizar(evento, payload) {
    if (!payload.actorId) return;

    await prisma.auditoria.create({
      data: {
        usuarioId: payload.actorId,
        accion:    evento,
        entidad:   payload.entidad || 'Sistema',
        entidadId: payload.entidadId || null,
        detalle:   payload.detalle || null,
        ip:        payload.ip || null,
      },
    });
  }
}

// ─── Subject ──────────────────────────────────────────────────
class EstadoSubject {
  constructor() {
    this._observers = [];
  }

  suscribir(observer) {
    if (!(observer instanceof EstadoObserver)) {
      throw new Error('Debe ser instancia de EstadoObserver');
    }
    this._observers.push(observer);
  }

  desuscribir(observer) {
    this._observers = this._observers.filter(o => o !== observer);
  }

  async notificar(evento, payload) {
    for (const observer of this._observers) {
      try {
        await observer.actualizar(evento, payload);
      } catch (err) {
        // Un observer fallido no detiene los demás
        console.error(`Observer ${observer.constructor.name} falló en evento ${evento}:`, err.message);
      }
    }
  }
}

// ─── Instancia singleton con los observers registrados ────────
const estadoSubject = new EstadoSubject();
estadoSubject.suscribir(new NotificacionObserver());
estadoSubject.suscribir(new AuditoriaObserver());

module.exports = { EstadoObserver, NotificacionObserver, AuditoriaObserver, EstadoSubject, estadoSubject };
