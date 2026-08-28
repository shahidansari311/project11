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

async function getAllProperties(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { status, category, search, minPrice, maxPrice, location, area } = req.query;

    const result = await propertyService.getAllProperties({ page, limit, status, category, search, minPrice, maxPrice, location, area });
    return successResponse(res, 200, result, "Properties retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function getPropertyById(req, res, next) {
  try {
    const { id } = req.params;
    const property = await propertyService.getPropertyById(id);
    return successResponse(res, 200, property, "Property details retrieved successfully");
  } catch (err) {
    if (err.message && err.message.includes("not found")) {
      return errorResponse(res, 404, err.message);
    }
    next(err);
  }
}

async function removePropertyImage(req, res, next) {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return errorResponse(res, 400, "Image URL is required in the request body");
    }

    const result = await propertyService.removePropertyImage(id, imageUrl);
    return successResponse(res, 200, result, "Image removed successfully");
  } catch (err) {
    if (err.message && err.message.includes("not found")) {
      return errorResponse(res, 404, err.message);
    }
    next(err);
  }
}

async function getPropertyFilters(req, res, next) {
  try {
    const filters = await propertyService.getPropertyFilters();
    return successResponse(res, 200, filters, "Property filters retrieved successfully");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createProperty,
  updateProperty,
  deleteProperty,
  getAllProperties,
  getPropertyById,
  removePropertyImage,
  getPropertyFilters,
};
