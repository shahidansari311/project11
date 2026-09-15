const { formatZodError } = require("../utils/zodErrorFormatter");

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || undefined;

  // Handle Zod Validation Errors if thrown directly
  if (err.name === "ZodError") {
    statusCode = 400;
    const formatted = formatZodError(err);
    message = formatted.message;
    errors = formatted.errors;
  }

  // Handle Prisma Unique Constraint Errors (P2002)
  else if (err.code === 'P2002') {
    statusCode = 409;
    const field = err.meta && err.meta.target ? (Array.isArray(err.meta.target) ? err.meta.target.join(", ") : err.meta.target) : "record";
    message = `A ${field} with this value already exists`;
  }

  // Handle Prisma Record Not Found (P2025)
  else if (err.code === 'P2025') {
    statusCode = 404;
    message = "Requested record not found";
  }

  // Handle Prisma Foreign Key Constraint Errors (P2003)
  else if (err.code === 'P2003') {
    statusCode = 400;
    const field = err.meta && err.meta.field_name ? err.meta.field_name : "referenced record";
    message = `Invalid ${field} provided`;
  }

  // Handle Prisma Value Too Long (P2000)
  else if (err.code === 'P2000') {
    statusCode = 400;
    message = "Input value exceeds maximum allowed length";
  }

  // Handle Prisma Invalid Column Value / Format (P2006, P2011, P2014, P2023)
  else if (['P2006', 'P2011', 'P2014', 'P2023'].includes(err.code)) {
    statusCode = 400;
    message = "Invalid input data format provided";
  }

  // Handle Multer upload errors
  else if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = "File size exceeds limit";
    } else {
      message = err.message || "File upload failed";
    }
  }

  // Handle JWT Auth Errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = err.name === 'TokenExpiredError' ? "Session expired. Please log in again" : "Invalid token";
  }

  // Handle Express Body Parsing JSON Syntax Error
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = "Invalid JSON payload";
  }

  // Log non-operational server bugs (500)
  if (!err.isOperational && statusCode === 500) {
    console.error("🔥 Server Error:", err);
    // Sanitize non-operational 500 error messages in production
    if (process.env.NODE_ENV === "production") {
      message = "An unexpected error occurred. Please try again later";
    }
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {})
  });
}

module.exports = { errorHandler };

