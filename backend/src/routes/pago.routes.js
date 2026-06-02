// ─── PAGO ROUTES ──────────────────────────────────────────────
const router = require('express').Router();
const ctrl   = require('../controllers/pago.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles }   = require('../middleware/roles.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { desembolsoRules } = require('../validators/evaluacion.validator');

const TESORERO = 'TESORERO';

router.get('/',          authenticate, allowRoles(TESORERO, 'ADMINISTRADOR'), ctrl.getAll);
router.get('/historial', authenticate, allowRoles(TESORERO, 'ADMINISTRADOR'), ctrl.getHistorial);
router.put('/:id/confirmar', authenticate, allowRoles(TESORERO), desembolsoRules, validate, ctrl.confirmar);

module.exports = router;
