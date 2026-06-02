// ─── MIDDLEWARE DE SUBIDA DE ARCHIVOS (Multer) ────────────────
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { badRequest } = require('../utils/response');

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';
const MAX_SIZE    = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5 MB

// Asegurar que existe el directorio de uploads
if (!fs.existsSync(UPLOAD_PATH)) fs.mkdirSync(UPLOAD_PATH, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_PATH),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Solo se permiten archivos PDF, JPG o PNG'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

// Middleware con manejo de errores integrado
const uploadSingle = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return badRequest(res, `El archivo excede el tamaño máximo de ${MAX_SIZE / 1024 / 1024} MB`);
      }
      return badRequest(res, err.message);
    }
    if (err) return badRequest(res, err.message);
    next();
  });
};

const uploadMultiple = (fieldName, max = 5) => (req, res, next) => {
  upload.array(fieldName, max)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return badRequest(res, err.message);
    }
    if (err) return badRequest(res, err.message);
    next();
  });
};

module.exports = { uploadSingle, uploadMultiple };
