// ══════════════════════════════════════════════════════════════
//  FACTORY METHOD — Creación de tipos de usuario
//
//  Problema: cada rol tiene datos adicionales distintos al crear
//  el usuario (Estudiante tiene programa/documento, los demás no).
//  Factory Method delega la creación concreta a subclases sin
//  que el cliente conozca los detalles de cada tipo.
//
//  Participantes:
//    - UsuarioFactory      → Creator abstracto (factory method)
//    - EstudianteFactory   → Concrete Creator
//    - EvaluadorFactory    → Concrete Creator
//    - AdministradorFactory→ Concrete Creator
//    - TesoreroFactory     → Concrete Creator
//    - crearUsuarioFactory → helper que devuelve la factory correcta
// ══════════════════════════════════════════════════════════════

const prisma = require('../config/prisma');

// ─── Creator abstracto ────────────────────────────────────────
class UsuarioFactory {
  /**
   * Factory Method: subclases deben implementar la creación.
   * @param {object} data  Datos del usuario
   * @param {string} passwordHash  Contraseña ya hasheada
   */
  async crearUsuario(data, passwordHash) {
    throw new Error(`${this.constructor.name} debe implementar crearUsuario()`);
  }

  /** Operación común: valida correo único antes de delegar */
  async _validarCorreoUnico(correo) {
    const existe = await prisma.usuario.findUnique({ where: { correo } });
    if (existe) throw { status: 409, message: 'Este correo ya está registrado' };
  }
}

// ─── Concrete Creator: Estudiante ─────────────────────────────
class EstudianteFactory extends UsuarioFactory {
  async crearUsuario({ nombre, correo, programa, documento }, passwordHash) {
    await this._validarCorreoUnico(correo);

    const docExiste = await prisma.estudiante.findUnique({ where: { documento } });
    if (docExiste) throw { status: 409, message: 'Este documento ya está registrado' };

    return prisma.usuario.create({
      data: {
        correo, password: passwordHash, nombre, rol: 'ESTUDIANTE',
        estudiante: { create: { programa, documento } },
      },
      include: { estudiante: true },
    });
  }
}

// ─── Concrete Creator: Evaluador ──────────────────────────────
class EvaluadorFactory extends UsuarioFactory {
  async crearUsuario({ nombre, correo }, passwordHash) {
    await this._validarCorreoUnico(correo);
    return prisma.usuario.create({
      data: { correo, password: passwordHash, nombre, rol: 'EVALUADOR' },
    });
  }
}

// ─── Concrete Creator: Administrador ──────────────────────────
class AdministradorFactory extends UsuarioFactory {
  async crearUsuario({ nombre, correo }, passwordHash) {
    await this._validarCorreoUnico(correo);
    return prisma.usuario.create({
      data: { correo, password: passwordHash, nombre, rol: 'ADMINISTRADOR' },
    });
  }
}

// ─── Concrete Creator: Tesorero ───────────────────────────────
class TesoreroFactory extends UsuarioFactory {
  async crearUsuario({ nombre, correo }, passwordHash) {
    await this._validarCorreoUnico(correo);
    return prisma.usuario.create({
      data: { correo, password: passwordHash, nombre, rol: 'TESORERO' },
    });
  }
}

// ─── Helper: devuelve la factory según el rol ─────────────────
function crearUsuarioFactory(rol) {
  const factories = {
    ESTUDIANTE:    new EstudianteFactory(),
    EVALUADOR:     new EvaluadorFactory(),
    ADMINISTRADOR: new AdministradorFactory(),
    TESORERO:      new TesoreroFactory(),
  };
  const factory = factories[rol];
  if (!factory) throw { status: 400, message: `Rol desconocido: ${rol}` };
  return factory;
}

module.exports = { UsuarioFactory, EstudianteFactory, EvaluadorFactory, AdministradorFactory, TesoreroFactory, crearUsuarioFactory };
