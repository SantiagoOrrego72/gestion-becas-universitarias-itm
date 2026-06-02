// ─── AUTH SERVICE ─────────────────────────────────────────────
const bcrypt = require('bcryptjs');
const prisma  = require('../config/prisma');
const { sign } = require('../utils/jwt');
const { crearUsuarioFactory } = require('../patterns/usuario.factory');

const SALT_ROUNDS = 10;

/**
 * Registrar nuevo estudiante
 */
const register = async ({ nombre, correo, password, programa, documento, rol = 'ESTUDIANTE' }) => {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  // FACTORY METHOD: delega la creación concreta a la factory del rol correspondiente
  const factory = crearUsuarioFactory(rol);
  const usuario = await factory.crearUsuario({ nombre, correo, programa, documento }, hash);

  const token = sign({ id: usuario.id, rol: usuario.rol });

  return {
    token,
    usuario: {
      id:       usuario.id,
      correo:   usuario.correo,
      nombre:   usuario.nombre,
      rol:      usuario.rol,
      programa: usuario.estudiante?.programa ?? null,
    },
  };
};

/**
 * Login
 */
const login = async ({ correo, password }) => {
  const usuario = await prisma.usuario.findUnique({
    where: { correo },
    include: { estudiante: true },
  });

  if (!usuario) throw { status: 401, message: 'Credenciales inválidas' };
  if (!usuario.activo) throw { status: 403, message: 'Cuenta desactivada. Contacta al administrador' };

  const valid = await bcrypt.compare(password, usuario.password);
  if (!valid) throw { status: 401, message: 'Credenciales inválidas' };

  // Auditoria login
  await prisma.auditoria.create({
    data: {
      usuarioId: usuario.id,
      accion: 'LOGIN',
      entidad: 'Usuario',
      entidadId: usuario.id,
      detalle: `Login exitoso — ${new Date().toISOString()}`,
    },
  });

  const token = sign({ id: usuario.id, rol: usuario.rol });

  return {
    token,
    usuario: {
      id: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      rol: usuario.rol,
      programa: usuario.estudiante?.programa || null,
    },
  };
};

/**
 * Cambiar contraseña
 */
const changePassword = async (usuarioId, { passwordActual, passwordNueva }) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw { status: 404, message: 'Usuario no encontrado' };

  const valid = await bcrypt.compare(passwordActual, usuario.password);
  if (!valid) throw { status: 400, message: 'La contraseña actual no es correcta' };

  const hash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
  await prisma.usuario.update({ where: { id: usuarioId }, data: { password: hash } });

  return { message: 'Contraseña actualizada correctamente' };
};

/**
 * Obtener perfil del usuario actual
 */
const getProfile = async (usuarioId) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true, correo: true, nombre: true, rol: true, creadoEn: true,
      estudiante: {
        select: { programa: true, documento: true, semestre: true, promedio: true, cuentaBancaria: true },
      },
    },
  });
  if (!usuario) throw { status: 404, message: 'Usuario no encontrado' };
  return usuario;
};

/**
 * Actualizar perfil estudiante
 */
const updateProfile = async (usuarioId, data) => {
  const { nombre, programa, semestre, promedio, cuentaBancaria } = data;

  const usuario = await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      nombre,
      estudiante: {
        update: { programa, semestre, promedio, cuentaBancaria },
      },
    },
    include: { estudiante: true },
  });

  return usuario;
};

module.exports = { register, login, changePassword, getProfile, updateProfile };
