const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { loginLimiter } = require("../../middlewares/rateLimiter.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { sendOtpSchema, verifyOtpSchema, refreshTokenSchema, profileSchema, profileImageSchema, registerSchema } = require("./auth.validation");
const { verifyAuth } = require("../../middlewares/auth.middleware");
const { requireRole } = require("../../middlewares/role.middleware");

const { imageUpload } = require("../../config/multer.config");
const { uploadProfileImage } = require("../../middlewares/upload.middleware");

// User routes
router.post("/user/send-otp",     loginLimiter, validate(sendOtpSchema), authController.userSendOtp);
router.post("/user/resend-otp",   loginLimiter, validate(sendOtpSchema), authController.userResendOtp);
router.post("/user/cancel-otp",   loginLimiter, validate(sendOtpSchema), authController.userCancelOtp);
router.post("/user/verify-otp",   loginLimiter, validate(verifyOtpSchema), authController.userVerifyOtp);
router.post("/user/register",     loginLimiter, imageUpload.single("profileImage"), uploadProfileImage, validate(registerSchema), authController.userRegister);
router.post("/user/refresh-token",loginLimiter, validate(refreshTokenSchema), authController.refreshUserToken);
router.post("/user/profile",      verifyAuth, requireRole("user"), imageUpload.single("profileImage"), uploadProfileImage, validate(profileSchema), authController.updateProfile);
router.post("/user/profile-image",verifyAuth, requireRole("user"), imageUpload.single("profileImage"), uploadProfileImage, validate(profileImageSchema), authController.updateProfileImage);
router.post("/user/logout",       verifyAuth, requireRole("user"), authController.userLogout);

// Admin routes
router.post("/admin/send-otp", loginLimiter, validate(sendOtpSchema), authController.adminSendOtp);
router.post("/admin/resend-otp", loginLimiter, validate(sendOtpSchema), authController.adminResendOtp);
router.post("/admin/cancel-otp", loginLimiter, validate(sendOtpSchema), authController.adminCancelOtp);
router.post("/admin/verify-otp", loginLimiter, validate(verifyOtpSchema), authController.adminVerifyOtp);
router.post("/admin/refresh-token", loginLimiter, validate(refreshTokenSchema), authController.refreshAdminToken);
router.post("/admin/logout", verifyAuth, requireRole("admin"), authController.adminLogout);

module.exports = router;
