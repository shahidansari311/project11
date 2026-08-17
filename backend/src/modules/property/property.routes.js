const express = require("express");
const router = express.Router();
const multer = require("multer");
const propertyController = require("./property.controller");
const { validate } = require("../../middlewares/validate.middleware");
const { createPropertySchema, updatePropertySchema } = require("./property.validation");
const { uploadPropertyImages } = require("../../middlewares/upload.middleware");

// Configure Multer to intercept multipart/form-data in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per image
});

// GET /admin/property — get list of all properties (supports ?status= & ?category= & ?search=)
router.get("/", propertyController.getAllProperties);

// GET /admin/property/:id — get single property by ID
router.get("/:id", propertyController.getPropertyById);

// POST /admin/property/add — create a new property listing
router.post("/add", upload.array("images", 10), uploadPropertyImages, validate(createPropertySchema), propertyController.createProperty);

// PUT & PATCH /admin/property/edit/:id or /admin/property/:id — edit property listing
router.put("/edit/:id", upload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), propertyController.updateProperty);
router.put("/:id", upload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), propertyController.updateProperty);
router.patch("/edit/:id", upload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), propertyController.updateProperty);
router.patch("/:id", upload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), propertyController.updateProperty);

// DELETE /admin/property/delete/:id or /admin/property/:id — delete property listing
router.delete("/delete/:id", propertyController.deleteProperty);
router.delete("/:id", propertyController.deleteProperty);

module.exports = router;
