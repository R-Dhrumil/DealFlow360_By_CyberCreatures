const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const ApiError = require('../utils/apiError');
const db = require('../config/db');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No authorization token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Check if token was revoked (logged out)
    const result = await db.query('SELECT id FROM jwt_blocklist WHERE token = $1', [token]);
    if (result.rows.length > 0) {
      return next(ApiError.unauthorized('Token has been revoked. Please log in again.'));
    }

    req.user = decoded;
    next();
  } catch (err) {
    return next(ApiError.unauthorized('Invalid or expired authentication token'));
  }
}

module.exports = authenticate;
