// ─── SOLICITUD ROUTES ─────────────────────────────────────────
const router = require('express').Router();
const ctrl   = require('../controllers/solicitud.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles }   = require('../middleware/roles.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { solicitudRules } = require('../validators/solicitud.validator');

router.get('/',    authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);
router.post('/',   authenticate, allowRoles('ESTUDIANTE'), solicitudRules, validate, ctrl.create);
router.patch('/:id/estado', authenticate, allowRoles('ADMINISTRADOR', 'EVALUADOR'), ctrl.updateEstado);

module.exports = router;
