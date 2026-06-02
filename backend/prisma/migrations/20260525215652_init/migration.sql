-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ESTUDIANTE', 'EVALUADOR', 'ADMINISTRADOR', 'TESORERO');

-- CreateEnum
CREATE TYPE "EstadoConvocatoria" AS ENUM ('ABIERTA', 'CERRADA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('EN_REVISION', 'APROBADO', 'RECHAZADO', 'DESEMBOLSADO');

-- CreateEnum
CREATE TYPE "EstadoDocumento" AS ENUM ('PENDIENTE', 'VERIFICADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PROCESADO', 'COMPLETADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ESTUDIANTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estudiantes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "programa" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "semestre" INTEGER,
    "promedio" DOUBLE PRECISION,
    "cuentaBancaria" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convocatorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" DOUBLE PRECISION NOT NULL,
    "cuposTotal" INTEGER NOT NULL,
    "cuposUsados" INTEGER NOT NULL DEFAULT 0,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "requisitos" TEXT,
    "documentosRequeridos" TEXT,
    "estado" "EstadoConvocatoria" NOT NULL DEFAULT 'ABIERTA',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convocatorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitudes_beca" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "convocatoriaId" TEXT NOT NULL,
    "evaluadorId" TEXT,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'EN_REVISION',
    "cartaMotivacion" TEXT NOT NULL,
    "fechaEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_beca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "solicitudId" TEXT,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rutaArchivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanio" INTEGER NOT NULL,
    "estado" "EstadoDocumento" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "evaluadorId" TEXT NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "observacion" TEXT NOT NULL,
    "fechaEval" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "cuentaBancaria" TEXT,
    "numeroTransaccion" TEXT,
    "fechaPago" TIMESTAMP(3),
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "detalle" TEXT,
    "ip" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");
CREATE UNIQUE INDEX "estudiantes_usuarioId_key" ON "estudiantes"("usuarioId");
CREATE UNIQUE INDEX "estudiantes_documento_key" ON "estudiantes"("documento");
CREATE UNIQUE INDEX "solicitudes_beca_estudianteId_convocatoriaId_key" ON "solicitudes_beca"("estudianteId", "convocatoriaId");
CREATE UNIQUE INDEX "evaluaciones_solicitudId_key" ON "evaluaciones"("solicitudId");
CREATE UNIQUE INDEX "pagos_solicitudId_key" ON "pagos"("solicitudId");

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "solicitudes_beca" ADD CONSTRAINT "solicitudes_beca_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "solicitudes_beca" ADD CONSTRAINT "solicitudes_beca_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "convocatorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "solicitudes_beca" ADD CONSTRAINT "solicitudes_beca_evaluadorId_fkey" FOREIGN KEY ("evaluadorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes_beca"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes_beca"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_evaluadorId_fkey" FOREIGN KEY ("evaluadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes_beca"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
