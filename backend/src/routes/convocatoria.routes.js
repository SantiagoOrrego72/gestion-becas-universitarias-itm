// ─── CONVOCATORIA ROUTES ──────────────────────────────────────
const router = require('express').Router();
const ctrl   = require('../controllers/convocatoria.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles }   = require('../middleware/roles.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { convocatoriaRules } = require('../validators/convocatoria.validator');

const ADMIN = 'ADMINISTRADOR';

// Públicas (cualquier usuario autenticado)
router.get('/',          authenticate, ctrl.getAll);
router.get('/:id',       authenticate, ctrl.getById);
router.get('/:id/ranking', authenticate, allowRoles(ADMIN, 'EVALUADOR'), ctrl.getRanking);

// Solo Admin
router.post('/',   authenticate, allowRoles(ADMIN), convocatoriaRules, validate, ctrl.create);
router.put('/:id', authenticate, allowRoles(ADMIN), convocatoriaRules, validate, ctrl.update);
router.delete('/:id', authenticate, allowRoles(ADMIN), ctrl.remove);
router.post('/beneficiarios/confirmar', authenticate, allowRoles(ADMIN), ctrl.confirmarBeneficiarios);

module.exports = router;
