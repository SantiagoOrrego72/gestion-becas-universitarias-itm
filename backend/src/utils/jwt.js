// ─── JWT UTILS ────────────────────────────────────────────────
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'fallback_secret_dev';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

const sign = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES });

const verify = (token) => {
  try {
    return { valid: true, decoded: jwt.verify(token, SECRET) };
  } catch (err) {
    return { valid: false, error: err.message };
  }
};

module.exports = { sign, verify };
