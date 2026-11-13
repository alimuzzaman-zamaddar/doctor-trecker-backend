// ---------------------------------------------------------------------------
// middleware/authMiddleware.js
// Purpose: protect private routes. Any request reaching a protected controller
// must carry a valid JWT; the decoded user is attached as req.user.
// ---------------------------------------------------------------------------

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getTokenFromRequest } = require('../utils/authCookie');

async function protect(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res
        .status(401)
        .json({ message: 'Not authorized. Please log in to continue.' });
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    // Look the user up again so a deleted account cannot keep using an old
    // token. select('-password') is unnecessary because the schema excludes it.
    const user = await User.findById(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ message: 'This account no longer exists. Please log in again.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: 'Your session has expired or is invalid. Please log in again.' });
  }
}

module.exports = { protect };
