// ══════════════════════════════════════════════════════════════
//  SEED — Datos de prueba del Sistema de Becas
// ══════════════════════════════════════════════════════════════

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // ── 1. LIMPIAR BD ──────────────────────────────────────────
  await prisma.auditoria.deleteMany();
  await prisma.notificacion.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.evaluacion.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.solicitudBeca.deleteMany();
  await prisma.convocatoria.deleteMany();
  await prisma.estudiante.deleteMany();
  await prisma.usuario.deleteMany();

  // ── 2. HASH PASSWORDS ──────────────────────────────────────
  const hash = (p) => bcrypt.hashSync(p, 10);

  // ── 3. USUARIOS ────────────────────────────────────────────
  const admin = await prisma.usuario.create({
    data: {
      correo: 'admin@itm.edu',
      password: hash('Admin1234'),
      nombre: 'Admin ITM',
      rol: 'ADMINISTRADOR',
    },
  });

  const evaluador = await prisma.usuario.create({
    data: {
      correo: 'evaluador@itm.edu',
      password: hash('Eval1234'),
      nombre: 'Dr. Carlos Rodríguez',
      rol: 'EVALUADOR',
    },
  });

  const tesorero = await prisma.usuario.create({
    data: {
      correo: 'tesoreria@itm.edu',
      password: hash('Tes1234'),
      nombre: 'Tesorería ITM',
      rol: 'TESORERO',
    },
  });

  // Usuarios estudiante
  const usuMaria = await prisma.usuario.create({
    data: {
      correo: 'estudiante@itm.edu',
      password: hash('Est1234'),
      nombre: 'María García',
      rol: 'ESTUDIANTE',
    },
  });
  const usuJuan = await prisma.usuario.create({
    data: {
      correo: 'juan@itm.edu',
      password: hash('Est1234'),
      nombre: 'Juan Pérez',
      rol: 'ESTUDIANTE',
    },
  });
  const usuAna = await prisma.usuario.create({
    data: {
      correo: 'ana@itm.edu',
      password: hash('Est1234'),
      nombre: 'Ana Martínez',
      rol: 'ESTUDIANTE',
    },
  });
  const usuCarlos = await prisma.usuario.create({
    data: {
      correo: 'carlos@itm.edu',
      password: hash('Est1234'),
      nombre: 'Carlos Ramírez',
      rol: 'ESTUDIANTE',
    },
  });
  const usuLaura = await prisma.usuario.create({
    data: {
      correo: 'laura@itm.edu',
      password: hash('Est1234'),
      nombre: 'Laura Sánchez',
      rol: 'ESTUDIANTE',
    },
  });
  const usuPedro = await prisma.usuario.create({
    data: {
      correo: 'pedro@itm.edu',
      password: hash('Est1234'),
      nombre: 'Pedro González',
      rol: 'ESTUDIANTE',
    },
  });

  // ── 4. PERFILES ESTUDIANTE ─────────────────────────────────
  const estMaria = await prisma.estudiante.create({
    data: {
      usuarioId: usuMaria.id,
      programa: 'Ingeniería de Sistemas',
      documento: '12345678',
      semestre: 6,
      promedio: 4.7,
      cuentaBancaria: '****1234',
    },
  });
  const estJuan = await prisma.estudiante.create({
    data: {
      usuarioId: usuJuan.id,
      programa: 'Administración de Empresas',
      documento: '23456789',
      semestre: 4,
      promedio: 3.8,
      cuentaBancaria: '****5678',
    },
  });
  const estAna = await prisma.estudiante.create({
    data: {
      usuarioId: usuAna.id,
      programa: 'Ingeniería Civil',
      documento: '34567890',
      semestre: 8,
      promedio: 4.8,
      cuentaBancaria: '****8012',
    },
  });
  const estCarlos = await prisma.estudiante.create({
    data: {
      usuarioId: usuCarlos.id,
      programa: 'Ingeniería de Sistemas',
      documento: '45678901',
      semestre: 7,
      promedio: 4.2,
      cuentaBancaria: '****3456',
    },
  });
  const estLaura = await prisma.estudiante.create({
    data: {
      usuarioId: usuLaura.id,
      programa: 'Psicología',
      documento: '56789012',
      semestre: 3,
      promedio: 4.5,
      cuentaBancaria: '****3478',
    },
  });
  const estPedro = await prisma.estudiante.create({
    data: {
      usuarioId: usuPedro.id,
      programa: 'Medicina',
      documento: '67890123',
      semestre: 9,
      promedio: 4.9,
      cuentaBancaria: '****9012',
    },
  });

  // ── 5. CONVOCATORIAS ───────────────────────────────────────
  const conv1 = await prisma.convocatoria.create({
    data: {
      nombre: 'Beca de Excelencia Académica 2026',
      descripcion: 'Beca dirigida a estudiantes con promedio superior a 4.5 en programas de pregrado.',
      monto: 2500000,
      cuposTotal: 10,
      cuposUsados: 5,
      fechaInicio: new Date('2026-01-01'),
      fechaFin: new Date('2027-12-31'),
      requisitos: 'Promedio mínimo de 4.5\nCertificado de notas\nCarta de motivación',
      documentosRequeridos: JSON.stringify(['Certificado de notas', 'Carta de motivación']),
      estado: 'ABIERTA',
    },
  });
  const conv2 = await prisma.convocatoria.create({
    data: {
      nombre: 'Beca Apoyo Socioeconómico',
      descripcion: 'Apoyo económico para estudiantes en situación de vulnerabilidad económica.',
      monto: 1800000,
      cuposTotal: 15,
      cuposUsados: 12,
      fechaInicio: new Date('2026-01-01'),
      fechaFin: new Date('2027-06-30'),
      requisitos: 'Estrato nivel 1 y 2\nCertificado de ingresos familiares\nDocumento de identidad',
      documentosRequeridos: JSON.stringify(['Documento de identidad', 'Certificado de ingresos familiares']),
      estado: 'ABIERTA',
    },
  });
  const conv3 = await prisma.convocatoria.create({
    data: {
      nombre: 'Beca Investigación Científica',
      descripcion: 'Financiamiento para estudiantes que participen en proyectos de investigación.',
      monto: 3000000,
      cuposTotal: 5,
      cuposUsados: 2,
      fechaInicio: new Date('2026-01-01'),
      fechaFin: new Date('2027-08-31'),
      requisitos: 'Proyecto de investigación aprobado\nAval del director de investigación\nHoja de vida académica',
      documentosRequeridos: JSON.stringify(['Proyecto de investigación', 'Hoja de vida académica']),
      estado: 'ABIERTA',
    },
  });
  const conv4 = await prisma.convocatoria.create({
    data: {
      nombre: 'Beca Deportiva',
      descripcion: 'Apoyo para estudiantes deportistas destacados en competencias nacionales o internacionales.',
      monto: 1500000,
      cuposTotal: 8,
      cuposUsados: 0,
      fechaInicio: new Date('2025-01-01'),
      fechaFin: new Date('2026-02-14'),
      requisitos: 'Certificado deportivo\nAval institucional',
      documentosRequeridos: JSON.stringify(['Certificado deportivo', 'Aval institucional']),
      estado: 'CERRADA',
    },
  });

  // ── 6. SOLICITUDES ─────────────────────────────────────────
  const sol1 = await prisma.solicitudBeca.create({
    data: {
      estudianteId: estMaria.id,
      convocatoriaId: conv1.id,
      evaluadorId: evaluador.id,
      estado: 'EN_REVISION',
      cartaMotivacion: 'Solicito esta beca por mi excelente rendimiento académico.',
      fechaEnvio: new Date('2026-02-14'),
    },
  });
  const sol2 = await prisma.solicitudBeca.create({
    data: {
      estudianteId: estJuan.id,
      convocatoriaId: conv2.id,
      evaluadorId: evaluador.id,
      estado: 'EN_REVISION',
      cartaMotivacion: 'Necesito apoyo económico para continuar mis estudios.',
      fechaEnvio: new Date('2026-02-09'),
    },
  });
  const sol3 = await prisma.solicitudBeca.create({
    data: {
      estudianteId: estAna.id,
      convocatoriaId: conv1.id,
      evaluadorId: evaluador.id,
      estado: 'APROBADO',
      cartaMotivacion: 'Tengo promedio de 4.8 y quiero continuar mi formación.',
      fechaEnvio: new Date('2026-02-08'),
    },
  });
  const sol4 = await prisma.solicitudBeca.create({
    data: {
      estudianteId: estCarlos.id,
      convocatoriaId: conv3.id,
      evaluadorId: evaluador.id,
      estado: 'RECHAZADO',
      cartaMotivacion: 'Participo en un proyecto de investigación en IA.',
      fechaEnvio: new Date('2026-02-04'),
    },
  });
  const sol5 = await prisma.solicitudBeca.create({
    data: {
      estudianteId: estLaura.id,
      convocatoriaId: conv2.id,
      evaluadorId: evaluador.id,
      estado: 'APROBADO',
      cartaMotivacion: 'Soy de estrato 1 y necesito apoyo.',
      fechaEnvio: new Date('2026-02-03'),
    },
  });
  const sol6 = await prisma.solicitudBeca.create({
    data: {
      estudianteId: estPedro.id,
      convocatoriaId: conv1.id,
      evaluadorId: evaluador.id,
      estado: 'APROBADO',
      cartaMotivacion: 'Soy el mejor estudiante de mi carrera.',
      fechaEnvio: new Date('2026-02-11'),
    },
  });

  // ── 7. DOCUMENTOS ──────────────────────────────────────────
  const docsSeed = [
    { estudianteId: estMaria.id, solicitudId: sol1.id, tipo: 'Certificado de notas',   nombre: 'notas_2025.pdf',       rutaArchivo: 'uploads/seed_notas_maria.pdf',       mimeType: 'application/pdf', tamanio: 102400, estado: 'VERIFICADO' },
    { estudianteId: estMaria.id, solicitudId: sol1.id, tipo: 'Carta de motivación',    nombre: 'carta_motivacion.pdf', rutaArchivo: 'uploads/seed_carta_maria.pdf',       mimeType: 'application/pdf', tamanio: 51200,  estado: 'VERIFICADO' },
    { estudianteId: estMaria.id, solicitudId: null,    tipo: 'Documento de identidad', nombre: 'cedula.pdf',           rutaArchivo: 'uploads/seed_cedula_maria.pdf',      mimeType: 'application/pdf', tamanio: 204800, estado: 'VERIFICADO' },
    { estudianteId: estAna.id,   solicitudId: sol3.id, tipo: 'Certificado de notas',   nombre: 'ana_notas.pdf',        rutaArchivo: 'uploads/seed_notas_ana.pdf',         mimeType: 'application/pdf', tamanio: 102400, estado: 'VERIFICADO' },
    { estudianteId: estAna.id,   solicitudId: sol3.id, tipo: 'Carta de motivación',    nombre: 'ana_carta.pdf',        rutaArchivo: 'uploads/seed_carta_ana.pdf',         mimeType: 'application/pdf', tamanio: 51200,  estado: 'VERIFICADO' },
    { estudianteId: estCarlos.id,solicitudId: sol4.id, tipo: 'Proyecto de investigación', nombre: 'carlos_proyecto.pdf', rutaArchivo: 'uploads/seed_proyecto_carlos.pdf', mimeType: 'application/pdf', tamanio: 307200, estado: 'VERIFICADO' },
    { estudianteId: estCarlos.id,solicitudId: sol4.id, tipo: 'Hoja de vida académica', nombre: 'carlos_hv.pdf',        rutaArchivo: 'uploads/seed_hv_carlos.pdf',         mimeType: 'application/pdf', tamanio: 153600, estado: 'VERIFICADO' },
    { estudianteId: estLaura.id, solicitudId: sol5.id, tipo: 'Documento de identidad', nombre: 'laura_cedula.pdf',     rutaArchivo: 'uploads/seed_cedula_laura.pdf',      mimeType: 'application/pdf', tamanio: 204800, estado: 'VERIFICADO' },
    { estudianteId: estLaura.id, solicitudId: sol5.id, tipo: 'Certificado de ingresos',nombre: 'laura_ingresos.pdf',   rutaArchivo: 'uploads/seed_ingresos_laura.pdf',    mimeType: 'application/pdf', tamanio: 102400, estado: 'VERIFICADO' },
    { estudianteId: estPedro.id, solicitudId: sol6.id, tipo: 'Certificado de notas',   nombre: 'pedro_notas.pdf',      rutaArchivo: 'uploads/seed_notas_pedro.pdf',       mimeType: 'application/pdf', tamanio: 102400, estado: 'VERIFICADO' },
    { estudianteId: estPedro.id, solicitudId: sol6.id, tipo: 'Carta de motivación',    nombre: 'pedro_carta.pdf',      rutaArchivo: 'uploads/seed_carta_pedro.pdf',       mimeType: 'application/pdf', tamanio: 51200,  estado: 'VERIFICADO' },
  ];
  for (const d of docsSeed) await prisma.documento.create({ data: d });

  // ── 8. EVALUACIONES ────────────────────────────────────────
  await prisma.evaluacion.create({
    data: {
      solicitudId: sol3.id,
      evaluadorId: evaluador.id,
      puntaje: 85,
      observacion: 'Excelente rendimiento académico. Cumple todos los requisitos.',
      fechaEval: new Date('2026-02-10'),
    },
  });
  await prisma.evaluacion.create({
    data: {
      solicitudId: sol4.id,
      evaluadorId: evaluador.id,
      puntaje: 32,
      observacion: 'El proyecto no cumple con los estándares mínimos requeridos.',
      fechaEval: new Date('2026-02-06'),
    },
  });
  await prisma.evaluacion.create({
    data: {
      solicitudId: sol5.id,
      evaluadorId: evaluador.id,
      puntaje: 88,
      observacion: 'Cumple todos los criterios socioeconómicos. Aprobada.',
      fechaEval: new Date('2026-02-10'),
    },
  });
  await prisma.evaluacion.create({
    data: {
      solicitudId: sol6.id,
      evaluadorId: evaluador.id,
      puntaje: 92,
      observacion: 'Promedio sobresaliente. Altamente recomendado.',
      fechaEval: new Date('2026-02-11'),
    },
  });

  // ── 9. PAGOS ───────────────────────────────────────────────
  await prisma.pago.create({
    data: {
      solicitudId: sol6.id,
      monto: 2500000,
      cuentaBancaria: '****9012',
      estado: 'PENDIENTE',
    },
  });
  await prisma.pago.create({
    data: {
      solicitudId: sol5.id,
      monto: 1800000,
      cuentaBancaria: '****3478',
      numeroTransaccion: 'TXN-20260210',
      fechaPago: new Date('2026-02-10'),
      estado: 'COMPLETADO',
    },
  });
  await prisma.pago.create({
    data: {
      solicitudId: sol3.id,
      monto: 2500000,
      cuentaBancaria: '****8012',
      numeroTransaccion: 'TXN-20260205',
      fechaPago: new Date('2026-02-05'),
      estado: 'COMPLETADO',
    },
  });

  // ── 10. NOTIFICACIONES ─────────────────────────────────────
  await prisma.notificacion.createMany({
    data: [
      { usuarioId: usuMaria.id, titulo: 'Solicitud recibida',   mensaje: 'Tu solicitud para Beca de Excelencia Académica 2026 fue recibida. Estado: En revisión.', leida: false },
      { usuarioId: usuMaria.id, titulo: 'Documento verificado', mensaje: 'Tu Certificado de notas ha sido verificado exitosamente.', leida: false },
      { usuarioId: usuAna.id,   titulo: '¡Beca aprobada!',      mensaje: 'Tu solicitud para Beca de Excelencia Académica 2026 fue APROBADA. Puntaje: 85/100.', leida: false },
      { usuarioId: usuLaura.id, titulo: '¡Beca aprobada!',      mensaje: 'Tu solicitud para Beca Apoyo Socioeconómico fue APROBADA. Puntaje: 88/100.', leida: false },
      { usuarioId: usuPedro.id, titulo: 'Beca desembolsada',    mensaje: 'El pago de tu beca Beca de Excelencia Académica 2026 fue procesado. N° transacción: TXN-20260205', leida: false },
    ],
  });

  console.log('✅ Seed completado exitosamente');
  console.log('\n📋 Credenciales de acceso:');
  console.log('  Estudiante:   estudiante@itm.edu  / Est1234');
  console.log('  Evaluador:    evaluador@itm.edu   / Eval1234');
  console.log('  Admin:        admin@itm.edu        / Admin1234');
  console.log('  Tesorería:    tesoreria@itm.edu   / Tes1234');
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
