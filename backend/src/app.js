const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { apiLimiter } = require("./middlewares/rateLimiter.middleware");
const { errorHandler } = require("./middlewares/errorHandler.middleware");
const routes = require("./routes");

const app = express();

app.use(helmet()); // Set security headers
app.use(cors());
app.use(express.json());
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
