const jwt = require('jsonwebtoken');
const config = require('../config/environment');

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
      req.companyId = decoded.companyId;
    } catch (err) {
      // Invalid token ignored for optional auth
    }
  }
  next();
}

module.exports = optionalAuth;
