const { verifyToken } = require("../utils/jwt.util");
const { extractTokenFromRequest } = require("../utils/cookie.util");
const { errorResponse } = require("../utils/apiResponse");

function verifyAuth(req, res, next) {
  // Support token from either Authorization header (Bearer) or HttpOnly secure cookie
  const token = extractTokenFromRequest(req);

  if (!token) {
    return errorResponse(res, 401, "Token missing");
  }

  try {
    req.user = verifyToken(token); // e.g. { id, role }
    next();
  } catch (err) {
    return errorResponse(res, 401, "Invalid or expired token");
  }
}

module.exports = { verifyAuth };
