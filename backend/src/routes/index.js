const express = require("express");
const router = express.Router();
const authRoutes = require("../modules/auth/auth.routes");
const { verifyAuth } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { successResponse } = require("../utils/apiResponse");

// Mount auth routes
router.use("/auth", authRoutes);

// Example protected route for testing
router.get("/user/profile", verifyAuth, requireRole("user"), (req, res) => {
  return successResponse(res, 200, { id: req.user.id }, "User profile data");
});

router.get("/admin/dashboard", verifyAuth, requireRole("admin"), (req, res) => {
  return successResponse(res, 200, { id: req.user.id }, "Admin dashboard data");
});

module.exports = router;
