// ---------------------------------------------------------------------------
// middleware/validateRequest.js
// Purpose: run after an express-validator chain and return a clean 422 response
// if any rule failed. Controllers can then assume req.body is valid.
// ---------------------------------------------------------------------------

const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  return res.status(422).json({
    message: 'Please correct the highlighted fields.',
    errors,
  });
}

module.exports = validateRequest;
