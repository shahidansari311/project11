const prisma = require("../../config/db");

// Helper to access Property model safely regardless of Prisma Client client casing
const getPropertyModel = () => {
  const model = prisma.property || prisma.Property;
  if (!model) {
    throw new Error("Property model not found on Prisma Client. Please run 'npx prisma generate'.");
  }
  return model;
};

async function syncLatestPriceToProperty(propertyId) {
  const priceHistoryModel = prisma.propertyPriceHistory || prisma.PropertyPriceHistory;
  const latestHistory = await priceHistoryModel.findFirst({
    where: { propertyId },
    orderBy: { date: "desc" }
  });
   
  if (latestHistory) {
    const propertyModel = getPropertyModel();
    const property = await propertyModel.findUnique({ where: { id: propertyId } });
    if (property) {
      const newPerUnitPrice = latestHistory.price / property.totalSize;
      await propertyModel.update({
        where: { id: propertyId },
        data: { 
          totalPrice: latestHistory.price,
          perUnitPrice: newPerUnitPrice,
          minInvestment: newPerUnitPrice // Always auto-sync 1 unit
        }
      });
    }
  }
}

/**
 * Create a new property listing.
 * Called by admin only.
 */
async function createProperty({
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
}) {
  const propertyModel = getPropertyModel();

  // Parse area — support both numeric and legacy string (e.g. "2000")
  const areaFloat = parseFloat(String(totalSize).replace(/[^0-9.]/g, ""));
  if (!areaFloat || areaFloat <= 0) {
    throw new Error("totalSize must be a positive numeric area (e.g. 2000 for 2000 sq.ft)");
  }

  // Unit math: totalUnits = totalSize (1 unit = 1 sq ft), perUnitPrice = totalPrice / totalUnits
  const totalUnits = Math.max(1, Math.floor(areaFloat));
  const perUnitPrice = totalPrice / totalUnits;

  const property = await propertyModel.create({
    data: {
      title,
      description,
      images,       // String[] — array of image URLs
      location,
      status:         status ?? "AVAILABLE",
      targetReturn,
      minInvestment:  perUnitPrice,  // auto: 1 unit price
      investors:      0,             // always starts at 0
      totalPrice,
      totalSize:      areaFloat,
      totalUnits,
      perUnitPrice,
      purchasedUnits: 0,
      category,
      youtubeVideoUrl,
      priceHistory: {
        create: {
          price: totalPrice,
          date: new Date(),
        }
      }
    },
    include: {
      priceHistory: true
    }
  });

  return property;
}

async function updateProperty(id, data) {
  const propertyModel = getPropertyModel();
  const existingProperty = await propertyModel.findUnique({ where: { id } });
  if (!existingProperty) {
    throw new Error("Property not found with the provided ID");
  }

  // Remove the clearImages flag since we are strictly overwriting with the frontend's array
  if (data.clearImages !== undefined) {
    delete data.clearImages;
  }

  // Always strip manually-supplied minInvestment — it is auto-computed from perUnitPrice
  delete data.minInvestment;

  // Parse totalSize if provided
  if (data.totalSize !== undefined) {
    const parsed = parseFloat(String(data.totalSize).replace(/[^0-9.]/g, ""));
    if (!parsed || parsed <= 0) {
      throw new Error("totalSize must be a positive numeric area");
    }
    data.totalSize = parsed;
  }

  // Recompute unit fields when price or area changes
  const newTotalPrice = data.totalPrice !== undefined ? data.totalPrice : existingProperty.totalPrice;
  const newTotalSize  = data.totalSize  !== undefined ? data.totalSize  : existingProperty.totalSize;

  if (data.totalPrice !== undefined || data.totalSize !== undefined) {
    const newTotalUnits  = Math.max(1, Math.floor(newTotalSize));
    const newPerUnitPrice = newTotalPrice / newTotalUnits;
    data.totalUnits   = newTotalUnits;
    data.perUnitPrice = newPerUnitPrice;
    data.minInvestment = newPerUnitPrice; // always 1 unit
  }

  const updatedProperty = await propertyModel.update({
    where: { id },
    data,
  });

  if (data.totalPrice !== undefined && data.totalPrice !== existingProperty.totalPrice) {
    const priceHistoryModel = prisma.propertyPriceHistory || prisma.PropertyPriceHistory;
    if (priceHistoryModel) {
      await priceHistoryModel.create({
        data: {
          propertyId: id,
          price: data.totalPrice,
          date: new Date(),
        }
      });
    }
  }

  return updatedProperty;
}

async function deleteProperty(id) {
  const propertyModel = getPropertyModel();
  const existingProperty = await propertyModel.findUnique({ where: { id } });
  if (!existingProperty) {
    throw new Error("Property not found with the provided ID");
  }

  await propertyModel.delete({ where: { id } });

  return { success: true, message: "Property deleted successfully" };
}

async function getAllProperties({ page = 1, limit = 20, status, category, search = "", minPrice, maxPrice, location, area, minArea, maxArea } = {}) {
  const skip = (page - 1) * limit;
  const propertyModel = getPropertyModel();

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (location) where.location = location;
  if (area) where.totalSize = area;
  
  // Note: if totalSize is a String, doing gte/lte on it will be alphabetical.
  // Ideally it should be numeric, but we will add the filter if minArea or maxArea is provided.
  if (minArea !== undefined || maxArea !== undefined) {
    where.totalSize = {};
    if (minArea !== undefined) where.totalSize.gte = String(minArea);
    if (maxArea !== undefined) where.totalSize.lte = String(maxArea);
  }
  
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.totalPrice = {};
    if (minPrice !== undefined) where.totalPrice.gte = Number(minPrice);
    if (maxPrice !== undefined) where.totalPrice.lte = Number(maxPrice);
  }
  if (search && search.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { location: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  // Run data fetch and count in parallel
  const [properties, total] = await Promise.all([
    propertyModel.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        priceHistory: {
          orderBy: { date: "asc" }
        }
      }
    }),
    propertyModel.count({ where }),
  ]);

  return {
    properties,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

async function getPropertyById(id) {
  const property = await getPropertyModel().findUnique({
    where: { id },
    include: {
      priceHistory: {
        orderBy: { date: "asc" }
      }
    }
  });

  if (!property) {
    throw new Error("Property not found with the provided ID");
  }

  return property;
}

async function removePropertyImage(id, imageUrlToRemove) {
  const propertyModel = getPropertyModel();
  const existingProperty = await propertyModel.findUnique({ where: { id } });
  if (!existingProperty) {
    throw new Error("Property not found with the provided ID");
  }

  const existingImages = existingProperty.images || [];
  const updatedImages = existingImages.filter((url) => url !== imageUrlToRemove);

  if (existingImages.length === updatedImages.length) {
    throw new Error("Image URL not found in this property");
  }

  const updatedProperty = await propertyModel.update({
    where: { id },
    data: { images: updatedImages },
  });

  return updatedProperty;
}

async function getPropertyFilters() {
  const propertyModel = getPropertyModel();
  
  // Fetch distinct categories, statuses, locations, and areas, plus min/max prices
  const [categoryResult, statusResult, locationResult, areaResult, priceResult] = await Promise.all([
    propertyModel.findMany({
      distinct: ['category'],
      select: { category: true }
    }),
    propertyModel.findMany({
      distinct: ['status'],
      select: { status: true }
    }),
    propertyModel.findMany({
      distinct: ['location'],
      select: { location: true }
    }),
    propertyModel.findMany({
      distinct: ['totalSize'],
      select: { totalSize: true }
    }),
    propertyModel.aggregate({
      _min: { totalPrice: true },
      _max: { totalPrice: true }
    })
  ]);

  return {
    categories: categoryResult.map(c => c.category).filter(Boolean),
    statuses: statusResult.map(s => s.status).filter(Boolean),
    locations: locationResult.map(l => l.location).filter(Boolean),
    areas: areaResult.map(a => a.totalSize).filter(Boolean),
    minPrice: priceResult._min.totalPrice || 0,
    maxPrice: priceResult._max.totalPrice || 0,
  };
}

async function addPriceHistory(id, { price }) {
  const propertyModel = getPropertyModel();
  const existingProperty = await propertyModel.findUnique({ where: { id } });
  if (!existingProperty) {
    throw new Error("Property not found with the provided ID");
  }

  const priceHistoryModel = prisma.propertyPriceHistory || prisma.PropertyPriceHistory;
  if (!priceHistoryModel) {
    throw new Error("PropertyPriceHistory model not found on Prisma Client. Please run 'npx prisma generate'.");
  }

  const record = await priceHistoryModel.create({
    data: {
      propertyId: id,
      price: price,
      date: new Date(),
    }
  });
  
  await syncLatestPriceToProperty(id);

  return record;
}

async function editPriceHistory(historyId, { price }) {
  const priceHistoryModel = prisma.propertyPriceHistory || prisma.PropertyPriceHistory;
  if (!priceHistoryModel) throw new Error("PropertyPriceHistory model not found.");

  const existingHistory = await priceHistoryModel.findUnique({ where: { id: historyId } });
  if (!existingHistory) {
    throw new Error("Price history not found with the provided ID");
  }
  
  const updatedRecord = await priceHistoryModel.update({
    where: { id: historyId },
    data: { price }
  });
  
  await syncLatestPriceToProperty(existingHistory.propertyId);
  
  return updatedRecord;
}

async function deletePriceHistory(historyId) {
  const priceHistoryModel = prisma.propertyPriceHistory || prisma.PropertyPriceHistory;
  if (!priceHistoryModel) throw new Error("PropertyPriceHistory model not found.");

  const existingHistory = await priceHistoryModel.findUnique({ where: { id: historyId } });
  if (!existingHistory) {
    throw new Error("Price history not found with the provided ID");
  }
  
  const count = await priceHistoryModel.count({ where: { propertyId: existingHistory.propertyId } });
  if (count <= 1) {
    throw new Error("Cannot delete the only price history point for this property.");
  }
  
  await priceHistoryModel.delete({ where: { id: historyId } });
  
  await syncLatestPriceToProperty(existingHistory.propertyId);
  
  return { success: true, message: "Price history deleted successfully" };
}

async function getPropertyInvestmentInfo(propertyId) {
  const propertyModel = getPropertyModel();
  const property = await propertyModel.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      totalPrice: true,
      totalSize: true,
      totalUnits: true,
      perUnitPrice: true,
      purchasedUnits: true,
      status: true,
    }
  });

  if (!property) {
    throw new Error("Property not found with the provided ID");
  }

  // ── Fallback: compute unit fields on-the-fly for properties created before migration ──
  let { totalUnits, perUnitPrice, purchasedUnits } = property;

  if (!totalUnits || totalUnits <= 0 || !perUnitPrice || perUnitPrice <= 0) {
    const areaFloat = parseFloat(String(property.totalSize).replace(/[^0-9.]/g, ""));
    if (areaFloat && areaFloat > 0 && property.totalPrice > 0) {
      totalUnits   = Math.max(1, Math.floor(areaFloat));
      perUnitPrice = property.totalPrice / totalUnits;

      // Persist computed values so future calls are instant (fire-and-forget)
      propertyModel.update({
        where: { id: propertyId },
        data: {
          totalSize:     areaFloat,
          totalUnits,
          perUnitPrice,
          minInvestment: perUnitPrice,
        },
      }).catch(() => {}); // non-blocking
    }
  }

  const remainingUnits = Math.max(0, totalUnits - (purchasedUnits || 0));
  return {
    propertyId:     property.id,
    status:         property.status,
    totalPrice:     property.totalPrice,
    totalSize:      property.totalSize,
    totalUnits,
    perUnitPrice,
    purchasedUnits: purchasedUnits || 0,
    remainingUnits,
    minInvestment:  perUnitPrice,                      // 1 unit price
    maxInvestment:  remainingUnits * perUnitPrice,
  };
}

module.exports = {
  createProperty,
  updateProperty,
  deleteProperty,
  getAllProperties,
  getPropertyById,
  removePropertyImage,
  getPropertyFilters,
  addPriceHistory,
  editPriceHistory,
  deletePriceHistory,
  getPropertyInvestmentInfo,
};
