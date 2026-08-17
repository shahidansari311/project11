const express = require("express");
const router = express.Router();
const propertyController = require("./property.controller");
const { validate } = require("../../middlewares/validate.middleware");
const { createPropertySchema } = require("./property.validation");

// POST /admin/property/add — create a new property listing
router.post("/add", validate(createPropertySchema), propertyController.createProperty);

module.exports = router;
