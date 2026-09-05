const logger = require('../utils/logger');
const config = require('../config/environment');

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (!err.isOperational) {
    logger.error('Unhandled System Error:', err);
    if (config.env === 'production') {
      message = 'An unexpected internal error occurred';
    }
  } else {
    logger.warn(`Operational Error [${statusCode}]: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(err.details && { details: err.details }),
    ...(config.env === 'development' && !err.isOperational && { stack: err.stack })
  });
}

module.exports = errorHandler;
