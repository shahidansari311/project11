const { errorResponse } = require("../utils/apiResponse");

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, "Access denied");
    }
    next();
  };
}

module.exports = { requireRole };
