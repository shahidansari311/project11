const dotenv = require("dotenv");
dotenv.config();

const config = {
    PORT: process.env.PORT || 4000,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET || "fallback_secret_key",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    DEMO_USER_PHONE: process.env.DEMO_USER_PHONE || "8858369783",
    DEMO_USER_OTP: process.env.DEMO_USER_OTP || "120905",
    DEMO_ADMIN_PHONE: process.env.DEMO_ADMIN_PHONE || "9876543210",
    DEMO_ADMIN_OTP: process.env.DEMO_ADMIN_OTP || "509021",
};

module.exports = config;
