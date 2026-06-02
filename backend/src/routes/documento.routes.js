// ─── DOCUMENTO ROUTES ─────────────────────────────────────────
const router = require('express').Router();
const ctrl   = require('../controllers/documento.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles }   = require('../middleware/roles.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');

// Estudiante: mis documentos
router.get('/',                      authenticate, allowRoles('ESTUDIANTE'), ctrl.getMios);
router.get('/solicitud/:solicitudId',authenticate, ctrl.getBySolicitud);
router.post('/upload',               authenticate, allowRoles('ESTUDIANTE'), uploadSingle('archivo'), ctrl.upload);
router.get('/:id/file',              authenticate, ctrl.getFile);
router.delete('/:id',                authenticate, allowRoles('ESTUDIANTE'), ctrl.remove);

// Admin/Evaluador: verificar documento
router.patch('/:id/verificar', authenticate, allowRoles('ADMINISTRADOR', 'EVALUADOR'), ctrl.verificar);

module.exports = router;
