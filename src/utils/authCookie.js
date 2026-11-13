// ---------------------------------------------------------------------------
// utils/authCookie.js
// Purpose: centralise how the JWT is stored in and read from an HttpOnly
// cookie, so the login, logout and auth middleware cannot drift apart.
//
// Why a cookie instead of localStorage?
// - HttpOnly cookies are not readable by JavaScript, so an XSS bug cannot
//   steal the token.
// - The frontend sends it automatically when Axios uses withCredentials.
// ---------------------------------------------------------------------------

const COOKIE_NAME = 'doctor_tracker_token';
const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    // Secure cookies are only sent over HTTPS, which production must use.
    secure: isProduction,
    // In production the frontend and API may live on different sites, so the
    // cookie needs SameSite=None. Locally they share "localhost", so Lax works
    // and still blocks cross-site requests.
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: SEVEN_DAYS_IN_MS,
  };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
}

function clearAuthCookie(res) {
  // Only path and domain need to match when clearing, but reusing the options
  // keeps the behaviour obvious.
  const { maxAge, ...clearOptions } = getCookieOptions();
  res.clearCookie(COOKIE_NAME, clearOptions);
}

function getTokenFromRequest(req) {
  // Primary source: the HttpOnly cookie. The Authorization header is supported
  // as a fallback for tools such as Postman.
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
}

module.exports = {
  COOKIE_NAME,
  setAuthCookie,
  clearAuthCookie,
  getTokenFromRequest,
};
