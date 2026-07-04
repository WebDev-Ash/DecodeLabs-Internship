function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const status = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  // zod-style validation errors
  const issues = err.issues;

  res.status(status).json({
    error: {
      message,
      issues: Array.isArray(issues) ? issues : undefined,
    },
  });
}

module.exports = { errorHandler };

