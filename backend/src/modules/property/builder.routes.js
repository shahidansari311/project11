const express = require("express");
const router = express.Router();
const propertyController = require("./controllers/builder.property.controller");
const { validate } = require("../../middlewares/validate.middleware");
const { createPropertySchema, addPriceHistorySchema } = require("./property.validation");
const { uploadPropertyImages } = require("../../middlewares/upload.middleware");
const { imageUpload } = require("../../config/multer.config");

router.post("/builder/add", imageUpload.array("images", 10), uploadPropertyImages, propertyController.builderAddProperty);
router.patch("/builder/:id", imageUpload.array("images", 10), uploadPropertyImages, propertyController.builderUpdateProperty);
router.get("/builder/list", propertyController.builderListProperties);
router.post("/builder/:id/price-history", validate(addPriceHistorySchema), propertyController.builderAddPriceHistory); 
router.delete("/builder/:id/image", propertyController.builderRemovePropertyImage);
router.delete("/builder/:id", propertyController.builderDeleteProperty);

module.exports = router;
