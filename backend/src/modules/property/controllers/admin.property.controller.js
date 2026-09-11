const propertyService = require("../services/admin.property.service");
const { successResponse, errorResponse } = require("../../../utils/apiResponse");

async function createProperty(req, res, next) {
  try {
    const { title, description, images, location, status, targetReturn, totalPrice, totalSize, category, youtubeVideoUrl, termPeriodYears } = req.body;
    const property = await propertyService.createProperty({ title, description, images, location, status, targetReturn, totalPrice, totalSize, category, youtubeVideoUrl, termPeriodYears });
    return successResponse(res, 201, property, "Property created successfully");
  } catch (err) {
    next(err);
  }
}

async function updateProperty(req, res, next) {
  try {
    const { id } = req.params;
    
    const { title, description, category, images, youtubeVideoUrl } = req.body;
    
    // Admin is only allowed to edit these specific fields
    const restrictedData = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(images !== undefined && { images }),
      ...(youtubeVideoUrl !== undefined && { youtubeVideoUrl })
    };

    const property = await propertyService.updateProperty(id, restrictedData);
    return successResponse(res, 200, property, "Property updated successfully");
  } catch (err) {
    if (err.message && err.message.includes("not found")) return errorResponse(res, 404, err.message);
    next(err);
  }
}

async function deleteProperty(req, res, next) {
  try {
    const { id } = req.params;
    const result = await propertyService.deleteProperty(id);
    return successResponse(res, 200, null, result.message);
  } catch (err) {
    if (err.message && err.message.includes("not found")) return errorResponse(res, 404, err.message);
    next(err);
  }
}

async function removePropertyImage(req, res, next) {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    if (!imageUrl) return errorResponse(res, 400, "Image URL is required in the request body");
    const result = await propertyService.removePropertyImage(id, imageUrl);
    return successResponse(res, 200, result, "Image removed successfully");
  } catch (err) {
    if (err.message && err.message.includes("not found")) return errorResponse(res, 404, err.message);
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
    if (err.message && err.message.includes("not found")) return errorResponse(res, 404, err.message);
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
    if (err.message && err.message.includes("not found")) return errorResponse(res, 404, err.message);
    next(err);
  }
}

async function deletePriceHistory(req, res, next) {
  try {
    const { historyId } = req.params;
    const result = await propertyService.deletePriceHistory(historyId);
    return successResponse(res, 200, null, result.message);
  } catch (err) {
    if (err.message && err.message.includes("not found")) return errorResponse(res, 404, err.message);
    if (err.message && err.message.includes("Cannot delete the only price history")) return errorResponse(res, 400, err.message);
    next(err);
  }
}

async function getBuilderSubmissions(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search;
    
    // We import publicPropertyService here just for list filtering
    const publicPropertyService = require("../services/public.property.service");
    const result = await publicPropertyService.getAllProperties({
      page,
      limit,
      search,
      status: req.query.status,
      builderId: req.query.builderId,
      onlyBuilderSubmissions: true,
      excludeRejected: false
    });
    
    return successResponse(res, 200, result, "Builder submissions retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function verifyProperty(req, res, next) {
  try {
    const { id } = req.params;
    const { status, adminRemark } = req.body; 
    
    if (!['AVAILABLE', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status for verification" });
    }
    
    const updatedProperty = await propertyService.updatePropertyStatus(id, status, adminRemark);
    return successResponse(res, 200, updatedProperty, `Property ${status.toLowerCase()} successfully`);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProperty,
  updateProperty,
  deleteProperty,
  removePropertyImage,
  addPriceHistory,
  editPriceHistory,
  deletePriceHistory,
  getBuilderSubmissions,
  verifyProperty,
};
