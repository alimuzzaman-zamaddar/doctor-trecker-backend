// ---------------------------------------------------------------------------
// utils/generateToken.js
// Purpose: create a signed JWT for an authenticated admin.
// Used only by authController.
// ---------------------------------------------------------------------------

const jwt = require('jsonwebtoken');

/**
 * @param {string} userId - MongoDB ObjectId of the logged-in user.
 * @returns {string} signed JSON Web Token.
 */
function generateToken(userId) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is missing from the environment variables.');
  }

  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = generateToken;
