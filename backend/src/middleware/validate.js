/**
 * Zod schema validation middleware.
 * Schema should validate { body, params, query } shape.
 * On success, attaches validated data to req.validated.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body:   req.body,
    params: req.params,
    query:  req.query,
  });

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    return res.status(400).json({
      success: false,
      error:   'Validation failed.',
      details: fieldErrors,
    });
  }

  req.validated = result.data;
  next();
};

module.exports = { validate };
