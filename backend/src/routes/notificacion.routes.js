// ─── NOTIFICACION ROUTES ──────────────────────────────────────
const router = require('express').Router();
const ctrl   = require('../controllers/notificacion.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/',          authenticate, ctrl.getMias);
router.get('/count',     authenticate, ctrl.contarNoLeidas);
router.patch('/leer',    authenticate, ctrl.marcarLeidas);

module.exports = router;
