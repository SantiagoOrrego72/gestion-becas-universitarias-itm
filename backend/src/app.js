// ══════════════════════════════════════════════════════════════
//  APP.JS — Configuración de Express
// ══════════════════════════════════════════════════════════════
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const logger = require('./utils/logger');

// ─── RUTAS ────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth.routes');
const convocatoriaRoutes = require('./routes/convocatoria.routes');
const solicitudRoutes    = require('./routes/solicitud.routes');
const documentoRoutes    = require('./routes/documento.routes');
const evaluacionRoutes   = require('./routes/evaluacion.routes');
const pagoRoutes         = require('./routes/pago.routes');
const notificacionRoutes = require('./routes/notificacion.routes');

const app = express();

// ─── SEGURIDAD ────────────────────────────────────────────────
// contentSecurityPolicy: false → Helmet v7 activa CSP con script-src-attr:'none' por defecto,
// lo que bloquea todos los onclick="..." generados dinámicamente en innerHTML del frontend.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// ─── CORS ─────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5500',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5500',
  'null', // file:// protocol (abrir HTML directamente)
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origen no permitido → ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── PARSERS (antes del rate limiter para poder leer req.body.correo) ─────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── RATE LIMITING ────────────────────────────────────────────
// En desarrollo el límite general es alto para no bloquear durante pruebas.
// En producción se usa el valor del .env (100 por defecto).
const isDev = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: isDev ? 2000 : (parseInt(process.env.RATE_LIMIT_MAX) || 100),
  message: { ok: false, error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,   // En desarrollo se omite el límite general completamente
});

// HU-02: Bloqueo por correo — 3 intentos fallidos → bloqueo 15 min
// Se aplica siempre (desarrollo y producción) para cumplir la regla de negocio.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => (req.body?.correo || req.ip),
  skipSuccessfulRequests: true,
  message: { ok: false, error: 'Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);
app.use('/api/auth/login', loginLimiter);

// ─── LOGGING HTTP ─────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ─── ARCHIVOS SUBIDOS (documentos PDF/imágenes) ───────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── RUTAS API ────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/convocatorias', convocatoriaRoutes);
app.use('/api/solicitudes',   solicitudRoutes);
app.use('/api/documentos',    documentoRoutes);
app.use('/api/evaluaciones',  evaluacionRoutes);
app.use('/api/pagos',         pagoRoutes);
app.use('/api/notificaciones',notificacionRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'API Sistema de Becas — funcionando', timestamp: new Date().toISOString() });
});

// ─── 404 & ERROR HANDLERS ─────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
