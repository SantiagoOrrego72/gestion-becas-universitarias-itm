// ─── DOCUMENTO SERVICE ────────────────────────────────────────
const path   = require('path');
const fs     = require('fs');
const prisma = require('../config/prisma');
const { construirValidador } = require('../patterns/documento.decorator');

// DECORATOR: stack de validadores compuesto (Propietario → Tamaño → Tipo → Base)
const documentoValidator = construirValidador();

/**
 * Listar documentos del estudiante autenticado
 */
const getMios = async (usuarioId) => {
  const est = await prisma.estudiante.findUnique({ where: { usuarioId } });
  if (!est) return [];

  return prisma.documento.findMany({
    where: { estudianteId: est.id },
    orderBy: { creadoEn: 'desc' },
  });
};

/**
 * Listar documentos de una solicitud
 */
const getBySolicitud = async (solicitudId) => {
  return prisma.documento.findMany({
    where: { solicitudId },
    orderBy: { creadoEn: 'desc' },
  });
};

/**
 * Subir documento
 */
const upload = async ({ tipo, solicitudId }, file, usuarioId) => {
  // DECORATOR: ejecuta la cadena de validadores compuesta (Tipo → Tamaño → Propietario)
  // El context es enriquecido por PropietarioDecorator con context.estudiante
  const context = { usuarioId, solicitudId };
  await documentoValidator.validar(file, context);

  // context.estudiante fue adjuntado por PropietarioDecorator
  const est = context.estudiante;

  const doc = await prisma.documento.create({
    data: {
      estudianteId: est.id,
      solicitudId:  solicitudId || null,
      tipo,
      nombre:       file.originalname,
      rutaArchivo:  file.path,
      mimeType:     file.mimetype,
      tamanio:      file.size,
      estado:       'PENDIENTE',
    },
  });

  await prisma.notificacion.create({
    data: {
      usuarioId,
      titulo:  'Documento subido',
      mensaje: `Tu documento "${tipo}" fue subido exitosamente y está pendiente de verificación.`,
    },
  });

  return doc;
};

/**
 * Descargar / ver documento
 */
const getFile = async (docId, usuarioId, rol) => {
  const doc = await prisma.documento.findUnique({ where: { id: docId } });
  if (!doc) throw { status: 404, message: 'Documento no encontrado' };

  // Estudiante solo accede a sus propios documentos
  if (rol === 'ESTUDIANTE') {
    const est = await prisma.estudiante.findUnique({ where: { usuarioId } });
    if (doc.estudianteId !== est?.id) throw { status: 403, message: 'Acceso denegado' };
  }

  if (!fs.existsSync(doc.rutaArchivo)) {
    throw { status: 404, message: 'Archivo físico no encontrado' };
  }

  return { rutaArchivo: doc.rutaArchivo, nombre: doc.nombre, mimeType: doc.mimeType };
};

/**
 * Verificar documento (admin/evaluador)
 */
const verificar = async (docId, estado, usuarioId) => {
  const doc = await prisma.documento.findUnique({ where: { id: docId } });
  if (!doc) throw { status: 404, message: 'Documento no encontrado' };

  const updated = await prisma.documento.update({
    where: { id: docId },
    data: { estado },
  });

  // Notificar al estudiante
  const est = await prisma.estudiante.findUnique({
    where: { id: doc.estudianteId },
    select: { usuarioId: true },
  });
  if (est) {
    await prisma.notificacion.create({
      data: {
        usuarioId: est.usuarioId,
        titulo: `Documento ${estado === 'VERIFICADO' ? 'verificado' : 'rechazado'}`,
        mensaje: `Tu documento "${doc.tipo}" ha sido ${estado === 'VERIFICADO' ? 'verificado exitosamente' : 'rechazado. Por favor súbelo de nuevo'}.`,
      },
    });
  }

  return updated;
};

/**
 * Eliminar documento
 */
const remove = async (docId, usuarioId) => {
  const doc = await prisma.documento.findUnique({ where: { id: docId } });
  if (!doc) throw { status: 404, message: 'Documento no encontrado' };

  const est = await prisma.estudiante.findUnique({ where: { usuarioId } });
  if (doc.estudianteId !== est?.id) throw { status: 403, message: 'Acceso denegado' };

  // Eliminar archivo físico
  if (fs.existsSync(doc.rutaArchivo)) fs.unlinkSync(doc.rutaArchivo);

  await prisma.documento.delete({ where: { id: docId } });
};

module.exports = { getMios, getBySolicitud, upload, getFile, verificar, remove };
