// ─── VALIDADORES DE CONVOCATORIA ──────────────────────────────
const { body } = require('express-validator');

const convocatoriaRules = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('monto')
    .notEmpty().withMessage('El monto es requerido')
    .isFloat({ min: 0 }).withMessage('El monto debe ser un número positivo'),
  body('cuposTotal')
    .notEmpty().withMessage('Los cupos son requeridos')
    .isInt({ min: 1 }).withMessage('Debe haber al menos 1 cupo'),
  body('fechaInicio')
    .notEmpty().withMessage('La fecha de inicio es requerida')
    .isISO8601().withMessage('Fecha de inicio inválida'),
  body('fechaFin')
    .notEmpty().withMessage('La fecha de cierre es requerida')
    .isISO8601().withMessage('Fecha de cierre inválida')
    .custom((val, { req }) => {
      if (new Date(val) <= new Date(req.body.fechaInicio)) {
        throw new Error('La fecha de cierre debe ser posterior a la de inicio');
      }
      return true;
    }),
  body('estado')
    .optional()
    .isIn(['ABIERTA', 'CERRADA']).withMessage('Estado inválido'),
  body('documentosRequeridos')
    .optional()
    .isArray().withMessage('documentosRequeridos debe ser un arreglo'),
];

module.exports = { convocatoriaRules };
