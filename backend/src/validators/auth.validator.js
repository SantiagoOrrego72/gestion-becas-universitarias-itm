// ─── VALIDADORES DE AUTENTICACIÓN ────────────────────────────
const { body } = require('express-validator');

const loginRules = [
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('Correo inválido'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),
];

const registerRules = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('Correo inválido')
    .matches(/\.(edu|edu\.co)$/i).withMessage('Solo se permiten correos institucionales (.edu o .edu.co)'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener mínimo 8 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
    .matches(/[0-9]/).withMessage('Debe contener al menos un número')
    .matches(/[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/).withMessage('Debe contener al menos un carácter especial (!@#$%^&* etc.)'),
  body('programa')
    .trim()
    .notEmpty().withMessage('El programa académico es requerido'),
  body('documento')
    .trim()
    .notEmpty().withMessage('El documento de identidad es requerido')
    .isLength({ min: 5 }).withMessage('Documento inválido'),
];

const changePasswordRules = [
  body('passwordActual').notEmpty().withMessage('La contraseña actual es requerida'),
  body('passwordNueva')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
    .matches(/[0-9]/).withMessage('Debe contener al menos un número')
    .matches(/[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/).withMessage('Debe contener al menos un carácter especial'),
];

module.exports = { loginRules, registerRules, changePasswordRules };
