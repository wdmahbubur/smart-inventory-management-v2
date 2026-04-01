/**
 * Global Error interceptor
 * Catches all errors thrown in routes (via express-async-errors).
 * Maps PostgreSQL error codes and known error types to clean HTTP responses.
 */
const errorHandler = (err, req, res, next) => {
  // Log in dev, minimal in prod
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err.message);
    if (err.code) console.error('[PG CODE]', err.code);
  }

  // Database constraint violations
  if (err.code === '23505') {
    // unique_violation
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry — this resource already exists.',
    });
  }

  if (err.code === '23503') {
    // foreign_key_violation
    return res.status(409).json({
      success: false,
      error: 'Referenced resource does not exist.',
    });
  }

  if (err.code === '23514') {
    // check_violation
    return res.status(400).json({
      success: false,
      error: 'Value violates a database constraint (e.g. stock cannot be negative).',
    });
  }

  if (err.code === '22P02') {
    // invalid_text_representation (e.g. bad UUID)
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format.',
    });
  }

  // Authentication errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired.' });
  }

  // Application errors
  if (err.statusCode) {
    const response = { success: false, error: err.message };
    if (err.details)     response.details     = err.details;
    if (err.conflictType) response.conflictType = err.conflictType;
    return res.status(err.statusCode).json(response);
  }

  // Catch-all
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message || 'Internal server error.',
  });
};

module.exports = { errorHandler };
