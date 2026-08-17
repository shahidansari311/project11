const express = require("express");
const router = express.Router();
const propertyController = require("./property.controller");
const { validate } = require("../../middlewares/validate.middleware");
const { createPropertySchema, updatePropertySchema } = require("./property.validation");

// POST /admin/property/add — create a new property listing
router.post("/add", validate(createPropertySchema), propertyController.createProperty);

// PUT & PATCH /admin/property/edit/:id or /admin/property/:id — edit property listing
router.put("/edit/:id", validate(updatePropertySchema), propertyController.updateProperty);
router.put("/:id", validate(updatePropertySchema), propertyController.updateProperty);
router.patch("/edit/:id", validate(updatePropertySchema), propertyController.updateProperty);
router.patch("/:id", validate(updatePropertySchema), propertyController.updateProperty);

// DELETE /admin/property/delete/:id or /admin/property/:id — delete property listing
router.delete("/delete/:id", propertyController.deleteProperty);
router.delete("/:id", propertyController.deleteProperty);

module.exports = router;
