class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors; // Optional array of structured errors (e.g. validation issues)
    this.isOperational = true; // Distinguishes expected errors from programming bugs
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = null) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = "Unauthorized access") {
    return new AppError(message, 401);
  }

  static forbidden(message = "Access forbidden") {
    return new AppError(message, 403);
  }

  static notFound(message = "Resource not found") {
    return new AppError(message, 404);
  }

  static conflict(message) {
    return new AppError(message, 409);
  }

  static validation(errors, message = "Validation failed") {
    return new AppError(message, 400, errors);
  }
}

module.exports = AppError;

