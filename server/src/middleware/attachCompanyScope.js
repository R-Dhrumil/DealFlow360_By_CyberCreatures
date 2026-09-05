const ApiError = require('../utils/apiError');

function attachCompanyScope(req, res, next) {
  if (req.user && req.user.companyId) {
    req.companyId = req.user.companyId;
    return next();
  }

  if (req.user && req.user.role === 'customer') {
    return next();
  }

  return next(ApiError.forbidden('Company context is missing from user token'));
}

module.exports = attachCompanyScope;
