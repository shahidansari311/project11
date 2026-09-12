const propertyService = require("../services/builder.property.service");
const { successResponse, errorResponse } = require("../../../utils/apiResponse");
const { createPropertySchema, draftPropertySchema } = require("../property.validation");
const { formatZodError } = require("../../../utils/zodErrorFormatter");

async function builderAddProperty(req, res, next) {
  try {
    let propertyData = { ...req.body };
    if (propertyData.status !== "DRAFT") {
      propertyData.status = "PENDING_APPROVAL";
    }
    
    // Conditionally validate based on status
    let validatedData;
    if (propertyData.status === "DRAFT") {
      const result = draftPropertySchema.safeParse({ body: propertyData });
      if (!result.success) {
        const { message, errors } = formatZodError(result.error);
        return res.status(400).json({ success: false, message, errors });
      }
      validatedData = result.data.body;
      
      // Default empty fields to 0 or "" to satisfy Prisma non-null constraints
      validatedData.title = validatedData.title || "";
      validatedData.description = validatedData.description || "";
      validatedData.totalPrice = validatedData.totalPrice || 0;
      validatedData.totalSize = validatedData.totalSize || 0;
      validatedData.targetReturn = validatedData.targetReturn || 0;
      validatedData.category = validatedData.category || "RESIDENTIAL";
      validatedData.location = validatedData.location || "{}";
      
    } else {
      const result = createPropertySchema.safeParse({ body: propertyData });
      if (!result.success) {
        const { message, errors } = formatZodError(result.error);
        return res.status(400).json({ success: false, message, errors });
      }
      validatedData = result.data.body;
    }

    validatedData.builderId = req.user.id;
    if (!validatedData.images) {
      validatedData.images = [];
    }
    
    const property = await propertyService.createProperty(validatedData);
    return successResponse(res, 201, property, "Property saved successfully");
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
    
    // Conditionally validate based on status
    let validatedData;
    if (propertyData.status === "DRAFT") {
      const result = draftPropertySchema.safeParse({ body: propertyData });
      if (!result.success) {
        const { message, errors } = formatZodError(result.error);
        return res.status(400).json({ success: false, message, errors });
      }
      validatedData = result.data.body;
      
      // Default empty fields to 0 or "" to satisfy Prisma non-null constraints
      validatedData.title = validatedData.title || "";
      validatedData.description = validatedData.description || "";
      validatedData.totalPrice = validatedData.totalPrice || 0;
      validatedData.totalSize = validatedData.totalSize || 0;
      validatedData.targetReturn = validatedData.targetReturn || 0;
      validatedData.category = validatedData.category || "RESIDENTIAL";
      validatedData.location = validatedData.location || "{}";
      
    } else {
      const result = createPropertySchema.safeParse({ body: propertyData });
      if (!result.success) {
        const { message, errors } = formatZodError(result.error);
        return res.status(400).json({ success: false, message, errors });
      }
      validatedData = result.data.body;
    }


    if (req.body.images && Array.isArray(req.body.images)) {
      validatedData.images = req.body.images;
    }

    const property = await propertyService.updateProperty(id, validatedData);
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
      excludeRejected: false,
      excludeDrafts: status === "DRAFT" ? false : true
    });
    
    return successResponse(res, 200, result, "Builder properties retrieved successfully");
  } catch (error) {
    next(error);
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
  builderAddProperty,
  builderUpdateProperty,
  builderRemovePropertyImage,
  builderListProperties,
  builderAddPriceHistory,
  builderDeleteProperty
};
