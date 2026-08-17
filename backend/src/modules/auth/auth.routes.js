const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { loginLimiter } = require("../../middlewares/rateLimiter.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { sendOtpSchema, verifyOtpSchema, refreshTokenSchema, profileSchema, registerSchema } = require("./auth.validation");
const { verifyAuth } = require("../../middlewares/auth.middleware");
const { requireRole } = require("../../middlewares/role.middleware");

// User routes
router.post("/user/send-otp",     loginLimiter, validate(sendOtpSchema), authController.userSendOtp);
router.post("/user/resend-otp",   loginLimiter, validate(sendOtpSchema), authController.userResendOtp);
router.post("/user/cancel-otp",   loginLimiter, validate(sendOtpSchema), authController.userCancelOtp);
router.post("/user/verify-otp",   loginLimiter, validate(verifyOtpSchema), authController.userVerifyOtp);
router.post("/user/register",     loginLimiter, validate(registerSchema), authController.userRegister);
router.post("/user/refresh-token",loginLimiter, validate(refreshTokenSchema), authController.refreshUserToken);
router.post("/user/profile",      verifyAuth, requireRole("user"), validate(profileSchema), authController.updateProfile);
router.post("/user/logout",       verifyAuth, requireRole("user"), authController.userLogout);

// Admin routes
router.post("/admin/send-otp", loginLimiter, validate(sendOtpSchema), authController.adminSendOtp);
router.post("/admin/resend-otp", loginLimiter, validate(sendOtpSchema), authController.adminResendOtp);
router.post("/admin/verify-otp", loginLimiter, validate(verifyOtpSchema), authController.adminVerifyOtp);
router.post("/admin/refresh-token", loginLimiter, validate(refreshTokenSchema), authController.refreshAdminToken);

module.exports = router;
