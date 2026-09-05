import { ApiError } from '../utils/ApiError.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required before permission check'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. Role '${req.user.role}' is not authorized to access this resource. Required role(s): [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
};

export const scopeData = (resourceName) => {
  return (req, res, next) => {
    if (!req.user) return next();

    let filter = {};

    switch (req.user.role) {
      case 'ADMIN':
        filter = {};
        break;
      case 'PROCUREMENT_OFFICER':
        filter = { category: 'Procurement' };
        break;
      case 'MANAGER':
        filter = { department: req.user.department || 'General' };
        break;
      case 'USER':
      default:
        filter = { ownerId: req.user.id };
        break;
    }

    req.dbFilter = filter;
    next();
  };
};
