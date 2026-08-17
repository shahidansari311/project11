const propertyService = require("./property.service");
const { successResponse, errorResponse } = require("../../utils/apiResponse");

/**
 * POST /admin/property
 * Create a new property — admin only.
 */
async function createProperty(req, res, next) {
  try {
    const {
      title,
      description,
      images,
      location,
      status,
      targetReturn,
      minInvestment,
      totalPrice,
      totalSize,
      category,
    } = req.body;

    const property = await propertyService.createProperty({
      title,
      description,
      images,
      location,
      status,
      targetReturn,
      minInvestment,
      totalPrice,
      totalSize,
      category,
    });

    return successResponse(res, 201, property, "Property created successfully");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createProperty,
};
