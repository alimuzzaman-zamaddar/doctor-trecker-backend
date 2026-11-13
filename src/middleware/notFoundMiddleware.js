// ---------------------------------------------------------------------------
// middleware/notFoundMiddleware.js
// Purpose: respond with JSON, instead of Express' default HTML page, when no
// route matches the request.
// ---------------------------------------------------------------------------

function notFound(req, res) {
  return res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = notFound;
