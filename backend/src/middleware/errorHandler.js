const errorHandler = (err, req, res, next) => {
  // Basic centralized error logging
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err.stack || err.message || err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({ message });
};

module.exports = errorHandler;
