const express = require("express");
const router = express.Router();
const authRoutes = require("../modules/auth/auth.routes");
const { verifyAuth } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { successResponse } = require("../utils/apiResponse");

const { validate } = require("../middlewares/validate.middleware");
const { adminCreateUserSchema, adminUpdateUserSchema } = require("../modules/auth/auth.validation");
const authController = require("../modules/auth/auth.controller");

const propertyRoutes = require("../modules/property/property.routes");

// Mount auth routes
router.use("/auth", authRoutes);

// Mount property routes — all protected as admin-only
router.use("/admin/property", verifyAuth, requireRole("admin"), propertyRoutes);

// Protected admin routes
router.get("/admin/users", verifyAuth, requireRole("admin"), authController.getAllUsers);
router.get("/admin/users/:id", verifyAuth, requireRole("admin"), authController.getUserById);
router.post("/admin/users", verifyAuth, requireRole("admin"), validate(adminCreateUserSchema), authController.createUserByAdmin);
router.put("/admin/users/:id", verifyAuth, requireRole("admin"), validate(adminUpdateUserSchema), authController.updateUserByAdmin);
router.patch("/admin/users/:id", verifyAuth, requireRole("admin"), validate(adminUpdateUserSchema), authController.updateUserByAdmin);
router.delete("/admin/users/:id", verifyAuth, requireRole("admin"), authController.deleteUserByAdmin);

router.get("/user/profile", verifyAuth, requireRole("user"), (req, res) => {
  return successResponse(res, 200, { id: req.user.id }, "User profile data");
});

router.get("/admin/dashboard", verifyAuth, requireRole("admin"), (req, res) => {
  return successResponse(res, 200, { id: req.user.id }, "Admin dashboard data");
});

module.exports = router;
