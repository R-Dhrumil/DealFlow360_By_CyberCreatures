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
    try {
      const result = await db.query('SELECT id FROM jwt_blocklist WHERE token = $1', [token]);
      if (result.rows.length > 0) {
        return next(ApiError.unauthorized('Token has been revoked. Please log in again.'));
      }
    } catch (dbErr) {
      // 42P01 is the PostgreSQL error code for "undefined_table"
      if (dbErr.code !== '42P01') {
        console.error('Database error in authenticate middleware:', dbErr);
      }
      // If the table doesn't exist yet, we just bypass the blocklist check
    }

    req.user = decoded;
    next();
  } catch (err) {
    return next(ApiError.unauthorized('Invalid or expired authentication token'));
  }
}

module.exports = authenticate;
