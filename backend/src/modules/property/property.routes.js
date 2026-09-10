const express = require("express");
const router = express.Router();
const { imageUpload } = require("../../config/multer.config");
const { validate } = require("../../middlewares/validate.middleware");
const { updatePropertyStatusSchema, createPropertySchema, updatePropertySchema, queryPropertySchema, addPriceHistorySchema, updatePriceHistorySchema, verifyPropertySchema } = require("./property.validation");
const { uploadPropertyImages } = require("../../middlewares/upload.middleware");

// Import newly split controllers
const adminController = require("./controllers/admin.property.controller");
const publicController = require("./controllers/public.property.controller");
const builderController = require("./controllers/builder.property.controller");

// GET /admin/property or /admin/property/list — get list of all properties
router.get("/", validate(queryPropertySchema), adminController.getAllProperties || publicController.getAllProperties);
router.get("/list", validate(queryPropertySchema), adminController.getAllProperties || publicController.getAllProperties);

// GET /admin/property/filters or /public/property/filters — get dynamic filters
router.get("/filters", publicController.getPropertyFilters);

// Admin Builder Property Verification Routes (Must be before /:id)
router.get("/builder-submissions", adminController.getBuilderSubmissions);
router.patch("/:id/verification", validate(verifyPropertySchema), adminController.verifyProperty);

// GET /admin/property/:id — get single property by ID
router.get("/:id", publicController.getPropertyById);

// GET /public/property/:id/calculate — get calculated investment amount
router.get("/:id/calculate", publicController.calculateInvestmentAmount);

// POST /admin/property/add — create a new property listing
router.post("/add", imageUpload.array("images", 10), uploadPropertyImages, validate(createPropertySchema), adminController.createProperty);

// POST /admin/property/:id/price-history — add price history
router.post("/:id/price-history", validate(addPriceHistorySchema), adminController.addPriceHistory);

// PUT /admin/property/price-history/:historyId — edit price history
router.put("/price-history/:historyId", validate(updatePriceHistorySchema), adminController.editPriceHistory);

// DELETE /admin/property/price-history/:historyId — delete price history
router.delete("/price-history/:historyId", adminController.deletePriceHistory);

// PUT & PATCH /admin/property/edit/:id or /admin/property/:id — edit property listing
router.put("/edit/:id", imageUpload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), adminController.updateProperty);
router.put("/:id", imageUpload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), adminController.updateProperty);
router.patch("/edit/:id", imageUpload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), adminController.updateProperty);
router.patch("/:id", imageUpload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), adminController.updateProperty);

// Builder Property Routes
router.post("/builder/add", imageUpload.array("images", 10), uploadPropertyImages, validate(createPropertySchema), builderController.builderAddProperty);
router.patch("/builder/:id", imageUpload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), builderController.builderUpdateProperty);
router.get("/builder/list", builderController.builderListProperties);

// Builder Management Routes
router.post("/builder/:id/price-history", validate(addPriceHistorySchema), builderController.builderAddPriceHistory);
router.delete("/builder/:id/image", builderController.builderRemovePropertyImage);
router.delete("/builder/:id", builderController.builderDeleteProperty);

// DELETE /admin/property/delete/:id or /admin/property/:id — delete property listing
router.delete("/delete/:id", adminController.deleteProperty);
router.delete("/:id", adminController.deleteProperty);

// DELETE /admin/property/:id/image — delete a specific image from a property
router.delete("/:id/image", adminController.removePropertyImage);

module.exports = router;
