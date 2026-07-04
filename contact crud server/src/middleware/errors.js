function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Not found' });
}

function errorHandler(err, req, res, next) {
  // Mongoose validation errors
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation failed', details: err.errors });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err && err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}

module.exports = { notFoundHandler, errorHandler };

