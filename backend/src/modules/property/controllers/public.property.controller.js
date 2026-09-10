const propertyService = require("../services/public.property.service");
const { successResponse, errorResponse } = require("../../../utils/apiResponse");

async function getAllProperties(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    let { status, category, search, minPrice, maxPrice, location, area, minArea, maxArea } = req.query;

    if (status && typeof status === 'string') {
      status = status.split(',');
    }
    if (location && typeof location === 'string') {
      location = location.split(',');
    }

    const allowedStatuses = ["AVAILABLE", "SOLD", "COMING_SOON"];
    if (status) {
      if (Array.isArray(status)) {
        status = status.filter(s => allowedStatuses.includes(s));
        if (status.length === 0) status = allowedStatuses;
      } else {
        if (!allowedStatuses.includes(status)) status = allowedStatuses;
      }
    } else {
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

module.exports = {
  getAllProperties,
  getPropertyById,
  getPropertyFilters,
  getLocationSuggestions,
  getPropertyInvestmentInfo,
};
