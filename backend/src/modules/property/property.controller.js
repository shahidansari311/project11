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
      totalPrice,
      totalSize,
      category,
      youtubeVideoUrl,
      termPeriodYears,
    } = req.body;

    const property = await propertyService.createProperty({
      title,
      description,
      images,
      location,
      status,
      targetReturn,
      totalPrice,
      totalSize,
      category,
      youtubeVideoUrl,
      termPeriodYears,
    });

    return successResponse(res, 201, property, "Property created successfully");
  } catch (err) {
    next(err);
  }
}

async function updateProperty(req, res, next) {
  try {
    const { id } = req.params;
    const { title, images, youtubeVideoUrl, totalPrice, status } = req.body;
    
    // Admin only allowed to edit these fields
    const restrictedData = {
      ...(title !== undefined && { title }),
      ...(images !== undefined && { images }),
      ...(youtubeVideoUrl !== undefined && { youtubeVideoUrl }),
      ...(totalPrice !== undefined && { totalPrice }),
      ...(status !== undefined && { status })
    };

    const property = await propertyService.updateProperty(id, restrictedData);
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
    let { status, category, search, minPrice, maxPrice, location, area, minArea, maxArea } = req.query;

    // Security: Restrict public API to only show approved listings
    const allowedStatuses = ["AVAILABLE", "SOLD", "COMING_SOON"];
    if (status) {
      if (!allowedStatuses.includes(status)) {
        // If they ask for something like DRAFT, fallback to AVAILABLE
        status = "AVAILABLE";
      }
    } else {
      // By default, show all approved statuses
      status = allowedStatuses;
    }

    const result = await propertyService.getAllProperties({ page, limit, status, category, search, minPrice, maxPrice, location, area, minArea, maxArea });
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

async function getLocationSuggestions(req, res, next) {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return successResponse(res, 200, [], "Location suggestions retrieved successfully");
    }
    const suggestions = await propertyService.getLocationSuggestions(query.trim());
    return successResponse(res, 200, suggestions, "Location suggestions retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function addPriceHistory(req, res, next) {
  try {
    const { id } = req.params;
    const { price } = req.body;
    const result = await propertyService.addPriceHistory(id, { price });
    return successResponse(res, 201, result, "Price history added successfully");
  } catch (err) {
    if (err.message && err.message.includes("not found")) {
      return errorResponse(res, 404, err.message);
    }
    next(err);
  }
}

async function editPriceHistory(req, res, next) {
  try {
    const { historyId } = req.params;
    const { price } = req.body;
    const result = await propertyService.editPriceHistory(historyId, { price });
    return successResponse(res, 200, result, "Price history updated successfully");
  } catch (err) {
    if (err.message && err.message.includes("not found")) {
      return errorResponse(res, 404, err.message);
    }
    next(err);
  }
}

async function deletePriceHistory(req, res, next) {
  try {
    const { historyId } = req.params;
    const result = await propertyService.deletePriceHistory(historyId);
    return successResponse(res, 200, null, result.message);
  } catch (err) {
    if (err.message && err.message.includes("not found")) {
      return errorResponse(res, 404, err.message);
    }
    if (err.message && err.message.includes("Cannot delete the only price history")) {
      return errorResponse(res, 400, err.message);
    }
    next(err);
  }
}

/**
 * GET /public/property/:id/investment-info
 * GET /user/property/:id/investment-info
 * Returns per-unit price, remaining units, min/max investment for the property.
 */
async function getPropertyInvestmentInfo(req, res, next) {
  try {
    const { id } = req.params;
    const info = await propertyService.getPropertyInvestmentInfo(id);
    return successResponse(res, 200, info, "Property investment info retrieved successfully");
  } catch (err) {
    if (err.message && err.message.includes("not found")) {
      return errorResponse(res, 404, err.message);
    }
    next(err);
  }
}


async function builderAddPriceHistory(req, res, next) {
  try {
    const { id } = req.params;
    const { price } = req.body;
    
    const property = await propertyService.getPropertyById(id);
    if (!property) return errorResponse(res, 404, "Property not found");
    if (property.builderId !== req.user.id && req.user.role !== "admin") {
      return errorResponse(res, 403, "You do not have permission to update this property");
    }

    const result = await propertyService.addPriceHistory(id, { price });
    return successResponse(res, 201, result, "Price history added successfully");
  } catch (err) {
    next(err);
  }
}

async function builderDeleteProperty(req, res, next) {
  try {
    const { id } = req.params;
    
    const property = await propertyService.getPropertyById(id);
    if (!property) return errorResponse(res, 404, "Property not found");
    if (property.builderId !== req.user.id && req.user.role !== "admin") {
      return errorResponse(res, 403, "You do not have permission to delete this property");
    }

    const result = await propertyService.deleteProperty(id);
    return successResponse(res, 200, null, result.message);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  builderAddPriceHistory,
  builderDeleteProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getAllProperties,
  getLocationSuggestions,
  getPropertyById,
  removePropertyImage,
  getPropertyFilters,
  addPriceHistory,
  editPriceHistory,
  deletePriceHistory,
  getPropertyInvestmentInfo,
};

async function getBuilderSubmissions(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search;
    
    const result = await propertyService.getAllProperties({
      page,
      limit,
      search,
      status: req.query.status, // Can be PENDING_APPROVAL, AVAILABLE, etc.
      builderId: req.query.builderId,
      onlyBuilderSubmissions: true,
      excludeRejected: false
    });
    
    // Filter out properties that don't have a builder (only submissions)
    // Actually it's better to add builderId: { not: null } in service, but we can just filter here or let service handle it.
    // For simplicity, assuming service allows filtering by builderId in the future, 
    // but for now let's just return all properties if we don't have a specific builder filter.
    
    return successResponse(res, 200, result, "Builder submissions retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function verifyProperty(req, res, next) {
  try {
    const { id } = req.params;
    const { status, adminRemark } = req.body; // status should be 'AVAILABLE' or 'REJECTED'
    
    if (!['AVAILABLE', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status for verification" });
    }
    
    const updatedProperty = await propertyService.updatePropertyStatus(id, status, adminRemark);
    return successResponse(res, 200, updatedProperty, `Property ${status.toLowerCase()} successfully`);
  } catch (error) {
    next(error);
  }
}

async function builderAddProperty(req, res, next) {
  try {
    let propertyData = { ...req.body };
    if (propertyData.status !== "DRAFT") {
      propertyData.status = "PENDING_APPROVAL";
    }
    propertyData.builderId = req.user.id;
    // Images are already uploaded to Supabase and attached to req.body.images by uploadPropertyImages middleware
    if (!propertyData.images) {
      propertyData.images = [];
    }
    
    const property = await propertyService.createProperty(propertyData);
    return successResponse(res, 201, property, "Property listed successfully");
  } catch (err) {
    next(err);
  }
}

async function builderUpdateProperty(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await propertyService.getPropertyById(id);
    if (!existing) return errorResponse(res, 404, "Property not found");
    if (existing.builderId !== req.user.id && req.user.role !== "admin") {
      return errorResponse(res, 403, "You can only update your own properties");
    }

    let propertyData = { ...req.body };
    
    // Images are already processed by uploadPropertyImages middleware
    if (req.body.images && Array.isArray(req.body.images)) {
      propertyData.images = req.body.images;
    }

    const property = await propertyService.updateProperty(id, propertyData);
    return successResponse(res, 200, property, "Property updated successfully");
  } catch (err) {
    if (err.message && err.message.includes("not found")) return errorResponse(res, 404, err.message);
    next(err);
  }
}

async function builderRemovePropertyImage(req, res, next) {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    if (!imageUrl) return errorResponse(res, 400, "Image URL is required");

    const existing = await propertyService.getPropertyById(id);
    if (!existing) return errorResponse(res, 404, "Property not found");
    if (existing.builderId !== req.user.id && req.user.role !== "admin") {
      return errorResponse(res, 403, "You can only modify your own properties");
    }

    const result = await propertyService.removePropertyImage(id, imageUrl);
    return successResponse(res, 200, result, "Image removed successfully");
  } catch (err) {
    next(err);
  }
}

async function builderListProperties(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const status = req.query.status;
    const search = req.query.search;
    
    const result = await propertyService.getAllProperties({
      page,
      limit,
      search,
      status,
      builderId: req.user.id,
      excludeRejected: false
    });
    
    return successResponse(res, 200, result, "Builder properties retrieved successfully");
  } catch (error) {
    next(error);
  }
}

module.exports.getBuilderSubmissions = getBuilderSubmissions;
module.exports.verifyProperty = verifyProperty;
module.exports.builderAddProperty = builderAddProperty;
module.exports.builderUpdateProperty = builderUpdateProperty;
module.exports.builderRemovePropertyImage = builderRemovePropertyImage;
module.exports.builderListProperties = builderListProperties;
