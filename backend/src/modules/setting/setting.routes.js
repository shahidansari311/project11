const express = require("express");
const router = express.Router();
const settingController = require("./setting.controller");
const { verifyAuth } = require("../../middlewares/auth.middleware");
const { requireRole } = require("../../middlewares/role.middleware");

// Public routes
router.get("/public/tutorial-video", settingController.getTutorialVideo);

// Admin routes
router.post("/admin/tutorial-video", verifyAuth, requireRole("admin"), settingController.updateTutorialVideo);

module.exports = router;
