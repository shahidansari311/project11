const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { loginLimiter } = require("../../middlewares/rateLimiter.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { sendOtpSchema, verifyOtpSchema, refreshTokenSchema, profileSchema, profileImageSchema, registerSchema, adminCreateUserSchema } = require("./auth.validation");
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
router.get("/user/profile",       verifyAuth, requireRole("user", "builder"), authController.getProfile);
router.post("/user/profile",      verifyAuth, requireRole("user", "builder"), imageUpload.single("profileImage"), uploadProfileImage, validate(profileSchema), authController.updateProfile);
router.post("/user/profile-image",verifyAuth, requireRole("user", "builder"), imageUpload.single("profileImage"), uploadProfileImage, validate(profileImageSchema), authController.updateProfileImage);
router.post("/user/logout",       verifyAuth, requireRole("user", "builder"), authController.userLogout);
router.post("/user/push-token",   verifyAuth, requireRole("user", "builder"), authController.updatePushToken);

// Admin routes
router.post("/admin/login-step1", loginLimiter, authController.adminLoginStep1);
router.post("/admin/resend-otp", loginLimiter, authController.adminResendOtp);
router.post("/admin/cancel-otp", loginLimiter, authController.adminCancelOtp);
router.post("/admin/login-step2", loginLimiter, authController.adminVerifyOtp);
router.post("/admin/refresh-token", loginLimiter, validate(refreshTokenSchema), authController.refreshAdminToken);
router.post("/admin/logout", verifyAuth, requireRole("admin"), authController.adminLogout);

router.get("/admin/reset-password/question", authController.getSecurityQuestion);
router.post("/admin/reset-password/verify-answer", loginLimiter, authController.verifySecurityAnswer);
router.post("/admin/reset-password/confirm", loginLimiter, authController.resetPassword);

router.get("/admin/builders", verifyAuth, requireRole("admin"), authController.getAllBuilders);
router.post("/admin/builders", verifyAuth, requireRole("admin"), imageUpload.single("profileImage"), uploadProfileImage, validate(adminCreateUserSchema), authController.createBuilderByAdmin);

module.exports = router;
