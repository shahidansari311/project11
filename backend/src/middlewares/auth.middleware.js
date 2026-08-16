const { verifyToken } = require("../utils/jwt.util");
const { errorResponse } = require("../utils/apiResponse");

function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization; // "Bearer <token>"
  const token = authHeader && authHeader.split(" ")[1];

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
