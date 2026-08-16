const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { loginLimiter } = require("../../middlewares/rateLimiter.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { sendOtpSchema, verifyOtpSchema, refreshTokenSchema } = require("./auth.validation");

// User routes
router.post("/user/send-otp", loginLimiter, validate(sendOtpSchema), authController.userSendOtp);
router.post("/user/verify-otp", loginLimiter, validate(verifyOtpSchema), authController.userVerifyOtp);
router.post("/user/refresh-token", loginLimiter, validate(refreshTokenSchema), authController.refreshUserToken);

// Admin routes
router.post("/admin/send-otp", loginLimiter, validate(sendOtpSchema), authController.adminSendOtp);
router.post("/admin/verify-otp", loginLimiter, validate(verifyOtpSchema), authController.adminVerifyOtp);
router.post("/admin/refresh-token", loginLimiter, validate(refreshTokenSchema), authController.refreshAdminToken);

module.exports = router;
