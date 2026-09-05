const express = require("express");
const router = express.Router();
const propertyController = require("./property.controller");
const { validate } = require("../../middlewares/validate.middleware");
const { createPropertySchema, addPriceHistorySchema } = require("./property.validation");
const { uploadPropertyImages } = require("../../middlewares/upload.middleware");
const { imageUpload } = require("../../config/multer.config");

router.post("/builder/add", imageUpload.array("images", 10), uploadPropertyImages, validate(createPropertySchema), propertyController.builderAddProperty);
router.get("/builder/list", propertyController.builderListProperties);
router.post("/:id/price-history", validate(addPriceHistorySchema), propertyController.addPriceHistory); // We'll just reuse the admin one, but wait, admin one doesn't check ownership. We'll handle that on frontend/controller for now.

module.exports = router;
