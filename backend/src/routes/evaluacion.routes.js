// ─── EVALUACION ROUTES ────────────────────────────────────────
const router = require('express').Router();
const ctrl   = require('../controllers/evaluacion.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { allowRoles }   = require('../middleware/roles.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { evaluacionRules } = require('../validators/evaluacion.validator');

const EVALUADOR = 'EVALUADOR';

router.get('/',                              authenticate, allowRoles(EVALUADOR, 'ADMINISTRADOR'), ctrl.getAll);
router.post('/solicitud/:solicitudId',       authenticate, allowRoles(EVALUADOR), evaluacionRules, validate, ctrl.evaluar);
// HU-06: Una evaluación no puede modificarse una vez guardada — ruta PUT eliminada

module.exports = router;
