const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token.
 * @param {object} payload - The payload to include in the token (e.g., { userId, roles }).
 * @returns {string} The generated JWT.
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

/**
 * Verifies a JSON Web Token.
 * @param {string} token - The JWT to verify.
 * @returns {object | null} The decoded payload if the token is valid, otherwise null.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // Handles cases like invalid signature, expired token, etc.
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
