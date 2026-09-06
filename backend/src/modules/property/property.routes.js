const express = require("express");
const router = express.Router();
const { imageUpload } = require("../../config/multer.config");
const propertyController = require("./property.controller");
const { validate } = require("../../middlewares/validate.middleware");
const { updatePropertyStatusSchema, createPropertySchema, updatePropertySchema, queryPropertySchema, addPriceHistorySchema, updatePriceHistorySchema, verifyPropertySchema } = require("./property.validation");
const { uploadPropertyImages } = require("../../middlewares/upload.middleware");

// GET /admin/property or /admin/property/list — get list of all properties (supports ?status= & ?category= & ?search=)
router.get("/", validate(queryPropertySchema), propertyController.getAllProperties);
router.get("/list", validate(queryPropertySchema), propertyController.getAllProperties);
// GET /admin/property — get list of all properties (supports ?status= & ?category= & ?search=)
router.get("/", propertyController.getAllProperties);

// GET /admin/property/filters or /public/property/filters — get dynamic filters
router.get("/filters", propertyController.getPropertyFilters);

// Admin Builder Property Verification Routes (Must be before /:id)
router.get("/builder-submissions", propertyController.getBuilderSubmissions);
router.patch("/:id/verification", validate(verifyPropertySchema), propertyController.verifyProperty);

// GET /admin/property/:id — get single property by ID
router.get("/:id", propertyController.getPropertyById);

// POST /admin/property/add — create a new property listing
router.post("/add", imageUpload.array("images", 10), uploadPropertyImages, validate(createPropertySchema), propertyController.createProperty);

// POST /admin/property/:id/price-history — add price history
router.post("/:id/price-history", validate(addPriceHistorySchema), propertyController.addPriceHistory);

// PUT /admin/property/price-history/:historyId — edit price history
router.put("/price-history/:historyId", validate(updatePriceHistorySchema), propertyController.editPriceHistory);

// DELETE /admin/property/price-history/:historyId — delete price history
router.delete("/price-history/:historyId", propertyController.deletePriceHistory);

// PUT & PATCH /admin/property/edit/:id or /admin/property/:id — edit property listing
router.put("/edit/:id", imageUpload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), propertyController.updateProperty);
router.put("/:id", imageUpload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), propertyController.updateProperty);
router.patch("/edit/:id", imageUpload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), propertyController.updateProperty);
router.patch("/:id", imageUpload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), propertyController.updateProperty);



// Builder Property Routes (These should ideally be in a separate router mounted under /builder, but adding here for simplicity since we'll mount them under /builder in index.js or just use them)
router.post("/builder/add", imageUpload.array("images", 10), uploadPropertyImages, validate(createPropertySchema), propertyController.builderAddProperty);
router.patch("/builder/:id", imageUpload.array("images", 10), uploadPropertyImages, validate(updatePropertySchema), propertyController.builderUpdateProperty);
router.get("/builder/list", propertyController.builderListProperties);

// Builder Management Routes
router.post("/builder/:id/price-history", validate(addPriceHistorySchema), propertyController.builderAddPriceHistory);
router.delete("/builder/:id/image", propertyController.builderRemovePropertyImage);
router.delete("/builder/:id", propertyController.builderDeleteProperty);


// DELETE /admin/property/delete/:id or /admin/property/:id — delete property listing
router.delete("/delete/:id", propertyController.deleteProperty);
router.delete("/:id", propertyController.deleteProperty);

// DELETE /admin/property/:id/image — delete a specific image from a property
router.delete("/:id/image", propertyController.removePropertyImage);

module.exports = router;
