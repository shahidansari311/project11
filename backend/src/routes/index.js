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
const uploadRoutes = require("../modules/upload/upload.routes");
const documentRoutes = require("../modules/document/document.routes");
const favoriteRoutes = require("../modules/favorite/favorite.routes");

// Mount auth routes
router.use("/auth", authRoutes);

// Mount upload routes
router.use("/upload", uploadRoutes);

// Mount document routes
router.use("/", documentRoutes);

// Mount property routes — all protected as admin-only
router.use("/admin/property", verifyAuth, requireRole("admin"), propertyRoutes);

const multer = require("multer");
const { uploadProfileImage } = require("../middlewares/upload.middleware");

// Configure Multer to intercept multipart/form-data in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

// Protected admin routes
router.get("/admin/users", verifyAuth, requireRole("admin"), authController.getAllUsers);
router.get("/admin/users/:id", verifyAuth, requireRole("admin"), authController.getUserById);
router.post("/admin/users", verifyAuth, requireRole("admin"), upload.single("profileImage"), uploadProfileImage, validate(adminCreateUserSchema), authController.createUserByAdmin);
router.put("/admin/users/:id", verifyAuth, requireRole("admin"), upload.single("profileImage"), uploadProfileImage, validate(adminUpdateUserSchema), authController.updateUserByAdmin);
router.patch("/admin/users/:id", verifyAuth, requireRole("admin"), upload.single("profileImage"), uploadProfileImage, validate(adminUpdateUserSchema), authController.updateUserByAdmin);
router.delete("/admin/users/:id", verifyAuth, requireRole("admin"), authController.deleteUserByAdmin);

const propertyController = require("../modules/property/property.controller");

// Public property routes (No authentication required)
router.get("/public/property", propertyController.getAllProperties);
router.get("/public/property/:id", propertyController.getPropertyById);

// User property routes (protected for registered users)
router.get("/user/property", verifyAuth, requireRole("user"), propertyController.getAllProperties);
router.get("/user/property/:id", verifyAuth, requireRole("user"), propertyController.getPropertyById);

router.get("/user/profile", verifyAuth, requireRole("user"), authController.getProfile);
router.use("/user/favorites", verifyAuth, requireRole("user"), favoriteRoutes);

router.get("/admin/dashboard", verifyAuth, requireRole("admin"), (req, res) => {
  return successResponse(res, 200, { id: req.user.id }, "Admin dashboard data");
});

const favoriteController = require("../modules/favorite/favorite.controller");
router.get("/admin/favorites/stats", verifyAuth, requireRole("admin"), favoriteController.getAdminFavoriteStats);
router.get("/admin/favorites/property/:propertyId", verifyAuth, requireRole("admin"), favoriteController.getAdminPropertyFavorites);
router.get("/admin/favorites/user/:userId", verifyAuth, requireRole("admin"), favoriteController.getAdminUserFavorites);
router.post("/admin/favorites/user/:userId/property/:propertyId", verifyAuth, requireRole("admin"), favoriteController.toggleFavoriteByAdmin);

module.exports = router;
