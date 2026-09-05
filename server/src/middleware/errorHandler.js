const logger = require('../utils/logger');
const config = require('../config/environment');

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Detect PostgreSQL network, DNS, or authentication failure codes
  const isDbConnectionError = 
    err.code === 'ENOTFOUND' ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ETIMEDOUT' ||
    err.code === '28P01' || // invalid_password
    err.code === '28000' || // invalid_authorization_specification
    (err.message && (
      err.message.includes('getaddrinfo ENOTFOUND') ||
      err.message.includes('password authentication failed') ||
      err.message.includes('connect ECONNREFUSED')
    ));

  if (isDbConnectionError) {
    statusCode = 503;
    message = 'Database Connection Unavailable: Please check your DATABASE_URL and credentials in server/.env';
    logger.warn(`PostgreSQL Connection Warning: ${err.message}`);
  } else if (!err.isOperational) {
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
    details: err.message || null,
    ...(config.env === 'development' && !err.isOperational && !isDbConnectionError && { stack: err.stack })
  });
}

module.exports = errorHandler;
