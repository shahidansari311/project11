const { errorResponse } = require("../utils/apiResponse");

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle Prisma Unique Constraint Errors gracefully (if service manual check missed it)
  if (err.code === 'P2002') {
    statusCode = 409;
    const field = err.meta && err.meta.target ? err.meta.target[0] : "record";
    message = `A ${field} with this value already exists.`;
  }

  // Handle Prisma Record Not Found
  if (err.code === 'P2025') {
    statusCode = 404;
    message = "Record not found.";
  }

  // Log only actual bugs, not operational user errors like "Wrong password"
  if (!err.isOperational && statusCode === 500) {
    console.error("🔥 Server Error:", err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || undefined
  });
}

module.exports = { errorHandler };
