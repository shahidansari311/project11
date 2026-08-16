const { errorResponse } = require("../utils/apiResponse");

function errorHandler(err, req, res, next) {
  console.error(err.stack);
  return errorResponse(res, 500, err.message || "Internal Server Error");
}

module.exports = { errorHandler };
