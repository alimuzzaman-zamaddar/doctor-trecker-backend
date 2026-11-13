// ---------------------------------------------------------------------------
// middleware/errorMiddleware.js
// Purpose: one place that turns every error into a consistent JSON response.
// Controllers call next(error); this middleware decides the HTTP status and a
// safe message. Database internals are never leaked to the client.
// ---------------------------------------------------------------------------

function errorHandler(error, req, res, next) {
  // "next" must stay in the signature so Express recognises this as error
  // handling middleware, even though it is unused.
  void next;

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong.';
  let errors = null;

  // Invalid MongoDB ObjectId (for example /api/doctors/not-an-id).
  if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${error.path || 'id'} value.`;
  }

  // Mongoose schema validation failure.
  if (error.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed.';
    errors = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  // Unique index violation, e.g. a duplicate doctor email.
  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue || {})[0] || 'value';
    message = `A record with this ${field} already exists.`;
  }

  // Malformed JSON body.
  if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'The request body contains invalid JSON.';
  }

  // Expired or tampered JWT.
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // Never expose internal messages (such as connection errors) in production.
  if (statusCode >= 500) {
    console.error('Unhandled server error:', error);
    if (process.env.NODE_ENV === 'production') {
      message = 'An unexpected server error occurred.';
    }
  }

  const body = { message };
  if (errors) body.errors = errors;

  return res.status(statusCode).json(body);
}

module.exports = errorHandler;
