class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors; // Optional array of structured errors (e.g. validation issues)
    this.isOperational = true; // Distinguishes expected errors from programming bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
