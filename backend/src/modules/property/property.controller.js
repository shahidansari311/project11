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

async function updateProperty(req, res, next) {
  try {
    const { id } = req.params;
    const property = await propertyService.updateProperty(id, req.body);
    return successResponse(res, 200, property, "Property updated successfully");
  } catch (err) {
    if (err.message && err.message.includes("not found")) {
      return errorResponse(res, 404, err.message);
    }
    next(err);
  }
}

async function deleteProperty(req, res, next) {
  try {
    const { id } = req.params;
    const result = await propertyService.deleteProperty(id);
    return successResponse(res, 200, null, result.message);
  } catch (err) {
    if (err.message && err.message.includes("not found")) {
      return errorResponse(res, 404, err.message);
    }
    next(err);
  }
}

module.exports = {
  createProperty,
  updateProperty,
  deleteProperty,
};
