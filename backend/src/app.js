const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const { apiLimiter } = require("./middlewares/rateLimiter.middleware");
const { errorHandler } = require("./middlewares/errorHandler.middleware");
const routes = require("./routes");

const app = express();

// Disable ETags to prevent 304 Not Modified responses
app.set("etag", false);

// Global middleware to prevent caching on all routes
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    const allowedOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : [];
      
    // console.log("CORS Check - Origin:", origin);
    // console.log("CORS Check - Allowed:", allowedOrigins);
    
    // Allow requests with no origin (like mobile apps, postman, server-to-server)
    // Or if the origin is in our allowed list
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.error("CORS Error for origin:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(helmet()); // Set security headers
app.use(cors(corsOptions));
app.use(compression()); // Gzip response bodies
app.use(express.json({ limit: "1mb" }));
app.use(apiLimiter); // Apply global rate limiter

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
     status: "OK", 
     timestamp: new Date().toISOString() 
    });
});

// Mount API routes
app.use("/api/v1", routes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
