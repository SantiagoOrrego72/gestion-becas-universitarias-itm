// ─── AUTH ROUTES ──────────────────────────────────────────────
const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate }     = require('../middleware/validate.middleware');
const { loginRules, registerRules, changePasswordRules } = require('../validators/auth.validator');

// Públicas
router.post('/register', registerRules, validate, ctrl.register);
router.post('/login',    loginRules,    validate, ctrl.login);

// Protegidas
router.get('/me',              authenticate, ctrl.getProfile);
router.put('/me',              authenticate, ctrl.updateProfile);
router.put('/me/password',     authenticate, changePasswordRules, validate, ctrl.changePassword);

module.exports = router;
