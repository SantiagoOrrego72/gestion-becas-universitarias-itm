// ─── VALIDADORES DE SOLICITUD ─────────────────────────────────
const { body } = require('express-validator');

const solicitudRules = [
  body('convocatoriaId').notEmpty().withMessage('La convocatoria es requerida'),
  body('cartaMotivacion')
    .trim()
    .notEmpty().withMessage('La carta de motivación es requerida')
    .isLength({ min: 30 }).withMessage('La carta debe tener al menos 30 caracteres'),
];

module.exports = { solicitudRules };
