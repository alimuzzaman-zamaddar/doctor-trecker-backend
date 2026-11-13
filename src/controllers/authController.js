// ---------------------------------------------------------------------------
// controllers/authController.js
// Purpose: registration (first admin only), login, logout and "who am I".
// The JWT is written to an HttpOnly cookie so the frontend never stores it.
// ---------------------------------------------------------------------------

const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { setAuthCookie, clearAuthCookie } = require('../utils/authCookie');

/** Fields that are safe to send back to the browser. */
function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/**
 * POST /api/auth/register
 *
 * To keep a public deployment safe, self-registration is only possible while
 * the users collection is empty (the very first admin). After that, new admins
 * should be created with the seed script or directly in MongoDB.
 */
async function register(req, res, next) {
  try {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return res.status(403).json({
        message: 'An admin account already exists. Please log in instead.',
      });
    }

    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    setAuthCookie(res, token);

    return res.status(201).json({
      message: 'Admin account created successfully.',
      user: toPublicUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/auth/login
 * Return the same generic error for unknown email and wrong password so an
 * attacker cannot discover which emails are registered.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // "+password" overrides select:false so the hash is available for compare.
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    return res.json({
      message: 'Logged in successfully.',
      user: toPublicUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

/** POST /api/auth/logout - clear the cookie. */
function logout(req, res) {
  clearAuthCookie(res);
  return res.json({ message: 'Logged out successfully.' });
}

/** GET /api/auth/me - used by the frontend to restore the session on reload. */
function getMe(req, res) {
  return res.json({ user: toPublicUser(req.user) });
}

module.exports = { register, login, logout, getMe };
