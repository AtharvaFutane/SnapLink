const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  console.error(`[${status}] ${message}`);
  res.status(status).json({ success: false, error: message });
};

module.exports = errorHandler;
