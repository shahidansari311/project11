const AppError = require("../utils/AppError");

const apiKeyMiddleware = (req, res, next) => {
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : [];
    
  const origin = req.headers.origin;
  
  // If request is coming from our official web frontend, allow it.
  if (origin && allowedOrigins.includes(origin)) {
    return next();
  }

  // Otherwise, it must be the mobile app (or someone using Postman). 
  // We require the secret API key in the headers.
  const apiKey = req.headers["x-api-key"];
  const validApiKey = process.env.MOBILE_APP_SECRET || "vishal-shahid-sumeet-silverrealEstate";

  if (!apiKey || apiKey !== validApiKey) {
    return next(new AppError("Forbidden: Invalid or missing API Key", 403));
  }

  next();
};

module.exports = apiKeyMiddleware;
