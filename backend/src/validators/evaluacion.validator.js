// ─── VALIDADORES DE EVALUACIÓN ────────────────────────────────
const { body } = require('express-validator');

const evaluacionRules = [
  body('puntaje')
    .notEmpty().withMessage('El puntaje es requerido')
    .isInt({ min: 0, max: 100 }).withMessage('El puntaje debe estar entre 0 y 100'),
  body('observacion')
    .trim()
    .notEmpty().withMessage('La observación es requerida')
    .isLength({ min: 10 }).withMessage('La observación debe tener al menos 10 caracteres'),
  body('accion')
    .optional()
    .isIn(['aprobar', 'rechazar']).withMessage('Acción inválida'),
];

const desembolsoRules = [
  body('numeroTransaccion').trim().notEmpty().withMessage('El número de transacción es requerido'),
  body('fechaPago').notEmpty().withMessage('La fecha de pago es requerida').isISO8601().withMessage('Fecha inválida'),
  body('cuentaBancaria').optional().trim(),
];

module.exports = { evaluacionRules, desembolsoRules };
