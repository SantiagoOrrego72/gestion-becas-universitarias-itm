// ══════════════════════════════════════════════════════════════
//  DECORATOR — Validación de documentos
//
//  Problema: la validación de un documento tiene capas que se
//  agregan dinámicamente: tipo de archivo, tamaño, propiedad
//  del estudiante. Decorator permite componer estas reglas sin
//  herencia rígida y sin modificar el validador base.
//
//  Participantes:
//    - DocumentoValidator        → Component (interfaz base)
//    - DocumentoValidatorBase    → Concrete Component (siempre pasa)
//    - TipoArchivoDecorator      → Concrete Decorator
//    - TamanioDecorator          → Concrete Decorator
//    - PropietarioDecorator      → Concrete Decorator
//    - construirValidador()      → helper de composición
// ══════════════════════════════════════════════════════════════

const prisma = require('../config/prisma');

const MAX_SIZE    = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
const TIPOS_VALIDOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

// ─── Component (interfaz base) ────────────────────────────────
class DocumentoValidator {
  /**
   * @param {object} file     Objeto del archivo (Multer)
   * @param {object} context  Contexto adicional { usuarioId, solicitudId, ... }
   */
  async validar(file, context = {}) {
    throw new Error(`${this.constructor.name} debe implementar validar()`);
  }
}

// ─── Concrete Component (base siempre válida) ─────────────────
class DocumentoValidatorBase extends DocumentoValidator {
  async validar(_file, _context) {
    return true; // La base no tiene restricciones
  }
}

// ─── Abstract Decorator ───────────────────────────────────────
class DocumentoDecorator extends DocumentoValidator {
  constructor(validator) {
    super();
    if (!(validator instanceof DocumentoValidator)) {
      throw new Error('DocumentoDecorator requiere instancia de DocumentoValidator');
    }
    this._validator = validator;
  }

  async validar(file, context) {
    return this._validator.validar(file, context);
  }
}

// ─── Concrete Decorator: Tipo de archivo ──────────────────────
class TipoArchivoDecorator extends DocumentoDecorator {
  async validar(file, context) {
    if (!TIPOS_VALIDOS.includes(file.mimetype)) {
      throw {
        status: 400,
        message: `Tipo de archivo no permitido: ${file.mimetype}. Se aceptan: PDF, JPG, PNG.`,
      };
    }
    return super.validar(file, context);
  }
}

// ─── Concrete Decorator: Tamaño ───────────────────────────────
class TamanioDecorator extends DocumentoDecorator {
  constructor(validator, maxSize = MAX_SIZE) {
    super(validator);
    this.maxSize = maxSize;
  }

  async validar(file, context) {
    if (file.size > this.maxSize) {
      throw {
        status: 400,
        message: `El archivo excede el tamaño máximo (${this.maxSize / 1024 / 1024} MB).`,
      };
    }
    return super.validar(file, context);
  }
}

// ─── Concrete Decorator: Propiedad del estudiante ─────────────
class PropietarioDecorator extends DocumentoDecorator {
  async validar(file, context) {
    const { usuarioId, solicitudId } = context;

    if (!usuarioId) throw { status: 401, message: 'Usuario no autenticado' };

    const est = await prisma.estudiante.findUnique({ where: { usuarioId } });
    if (!est) throw { status: 404, message: 'Perfil de estudiante no encontrado' };

    if (solicitudId) {
      const sol = await prisma.solicitudBeca.findUnique({ where: { id: solicitudId } });
      if (!sol)                       throw { status: 404, message: 'Solicitud no encontrada' };
      if (sol.estudianteId !== est.id) throw { status: 403, message: 'Acceso denegado' };
    }

    // Adjuntar el estudiante al context para no buscarlo de nuevo
    context.estudiante = est;

    return super.validar(file, context);
  }
}

// ─── Helper de composición ─────────────────────────────────────
// Construye el stack de validadores como cadena de decoradores:
//   PropietarioDecorator
//     └─ TamanioDecorator
//          └─ TipoArchivoDecorator
//               └─ DocumentoValidatorBase
function construirValidador() {
  return new PropietarioDecorator(
    new TamanioDecorator(
      new TipoArchivoDecorator(
        new DocumentoValidatorBase()
      )
    )
  );
}

module.exports = {
  DocumentoValidator,
  DocumentoValidatorBase,
  DocumentoDecorator,
  TipoArchivoDecorator,
  TamanioDecorator,
  PropietarioDecorator,
  construirValidador,
};
