const dotenv = require("dotenv");
dotenv.config();

const config = {
    PORT: process.env.PORT || 4000,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET || "fallback_secret_key",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    ADMIN_PHONE: process.env.ADMIN_PHONE
};

module.exports = config;
