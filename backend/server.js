// ══════════════════════════════════════════════════════════════
//  SERVER.JS — Punto de entrada del servidor
// ══════════════════════════════════════════════════════════════

// Fijar el directorio de trabajo al directorio del backend
// para que las rutas relativas (.env, uploads/) funcionen
// sin importar desde dónde se ejecute el comando.
process.chdir(__dirname);

require('dotenv').config();
const app    = require('./src/app');
const prisma = require('./src/config/prisma');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await prisma.$connect();
    logger.info('✅ Conexión a PostgreSQL establecida');

    app.listen(PORT, () => {
      logger.info(`🚀 Backend corriendo en http://localhost:${PORT}`);
      logger.info(`📋 API disponible en http://localhost:${PORT}/api`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🎨 Frontend (React/Vite): http://localhost:5173`);
    });
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  logger.info('🛑 Servidor detenido correctamente');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error('Excepción no capturada:', err);
  process.exit(1);
});

start();
