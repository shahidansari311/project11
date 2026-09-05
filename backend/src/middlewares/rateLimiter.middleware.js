const rateLimit = require("express-rate-limit");
const { errorResponse } = require("../utils/apiResponse");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  handler: (req, res) => {
    return errorResponse(res, 429, "Too many login attempts, please try again after 15 minutes");
  }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  handler: (req, res) => {
    return errorResponse(res, 429, "Too many requests, please try again later");
  }
});

module.exports = { loginLimiter, apiLimiter };
