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
  builderId,
  termPeriodYears,
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

  let finalLocationStr = location;
  let finalMapLocation = null;

  if (typeof location === "object" && location !== null) {
    finalLocationStr = location.address || location.placeName || location.city || "Unknown Location";
    finalMapLocation = location;
  }

  const property = await propertyModel.create({
    data: {
      title,
      description,
      images,       // String[] — array of image URLs
      location: finalLocationStr,
      mapLocation: finalMapLocation,
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
      ...(builderId ? { builder: { connect: { id: builderId } } } : {}),
      termPeriodYears: termPeriodYears ? parseInt(termPeriodYears) : null,
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

  if (data.builderId !== undefined) {
    if (data.builderId) {
      data.builder = { connect: { id: data.builderId } };
    }
    delete data.builderId;
  }

  // Parse totalSize if provided
  if (data.totalSize !== undefined) {
    const parsed = parseFloat(String(data.totalSize).replace(/[^0-9.]/g, ""));
    if (!parsed || parsed <= 0) {
      throw new Error("totalSize must be a positive numeric area");
    }
    data.totalSize = parsed;
  }

  if (data.location !== undefined) {
    if (typeof data.location === "object" && data.location !== null) {
      data.mapLocation = data.location;
      data.location = data.location.address || data.location.placeName || data.location.city || "Unknown Location";
    } else if (data.location === null) {
      data.mapLocation = null;
    }
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

  // Calculate status automatically based on units if not explicitly overriding to something else
  const currentTotalUnits = data.totalUnits !== undefined ? data.totalUnits : existingProperty.totalUnits;
  const currentPurchasedUnits = existingProperty.purchasedUnits || 0;
  
  if (data.status !== "UNDER_REVIEW" && data.status !== "DRAFT" && data.status !== "PENDING_APPROVAL" && data.status !== "REJECTED") {
     if (currentPurchasedUnits >= currentTotalUnits) {
       data.status = "SOLD";
     } else {
       data.status = "AVAILABLE";
     }
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

async function getAllProperties({ page = 1, limit = 10, status, category, search = "", minPrice, maxPrice, location, area, minArea, maxArea, builderId, onlyBuilderSubmissions = false, excludeRejected = true } = {}) {
  const propertyModel = getPropertyModel();
  const skip = (page - 1) * limit;

  // Build filter object
  const where = {};
  if (status) {
    if (Array.isArray(status)) {
      where.status = { in: status };
    } else {
      where.status = status;
    }
  }
  // If not explicitly asking for rejected, and no status specified, hide rejected
  else if (excludeRejected) where.status = { not: "REJECTED" };

  if (category) where.category = category;
  
  if (location) {
    const locArr = Array.isArray(location) ? location : (typeof location === 'string' ? location.split(',') : [location]);
    if (locArr.length > 0) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: locArr.map(loc => ({
          location: { contains: loc.trim(), mode: 'insensitive' }
        }))
      });
    }
  }

  if (area) where.totalSize = area;
  if (builderId) where.builderId = builderId;
  else if (onlyBuilderSubmissions) where.builderId = { not: null };

  if (minArea !== undefined || maxArea !== undefined) {
    where.totalSize = {};
    if (minArea !== undefined) where.totalSize.gte = String(minArea);
    if (maxArea !== undefined) where.totalSize.lte = String(maxArea);
  }
  
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.perUnitPrice = {};
    if (minPrice !== undefined && minPrice !== "") where.perUnitPrice.gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== "") where.perUnitPrice.lte = Number(maxPrice);
    
    // If empty object, remove it
    if (Object.keys(where.perUnitPrice).length === 0) delete where.perUnitPrice;
  }
  if (search && search.trim()) {
    where.AND = where.AND || [];
    where.AND.push({
      OR: [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { location: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ]
    });
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
        },
        builder: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            profileUrl: true,
          }
        }
      }
    }),
    propertyModel.count({ where }),
  ]);

  const mappedProperties = properties.map(p => {
    let cleanLocation = p.location;
    try {
      const parsed = JSON.parse(p.location);
      if (parsed && parsed.address) cleanLocation = parsed.address;
    } catch (e) {}

    return {
      ...p,
      location: cleanLocation
    };
  });

  return {
    properties: mappedProperties,
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

async function getLocationSuggestions(query) {
  const uniqueLocations = new Set();
  
  try {
    // Fetch from OpenStreetMap Nominatim API for real-world places (India restricted)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`, {
      headers: {
        'User-Agent': 'SilverRealEstateApp/1.0'
      }
    });
    if (response.ok) {
      const data = await response.json();
      data.forEach(item => {
        if (item.address) {
          const { city, town, village, county, state_district, state } = item.address;
          const mainName = city || town || village || item.name;
          const distName = state_district || county;
          
          let locName = mainName;
          if (distName && locName !== distName) locName += `, ${distName}`;
          if (state && locName !== state) locName += `, ${state}`;
          
          if (locName) uniqueLocations.add(locName);
          else uniqueLocations.add(item.display_name);
        } else {
          uniqueLocations.add(item.display_name);
        }
      });
    }
  } catch (error) {
    console.error("Nominatim API error:", error);
  }

  // Fallback to database if external API yields no results or fails
  if (uniqueLocations.size === 0) {
    const propertyModel = getPropertyModel();
    const properties = await propertyModel.findMany({
      where: {
        location: { contains: query, mode: "insensitive" },
        status: { not: "REJECTED" }
      },
      select: { location: true },
      distinct: ['location'],
      take: 10
    });

    properties.forEach(p => {
      let locStr = p.location;
      try {
        const parsed = JSON.parse(locStr);
        if (parsed && parsed.address) locStr = parsed.address;
      } catch (e) {}
      if (locStr) uniqueLocations.add(locStr.trim());
    });
  }

  return Array.from(uniqueLocations);
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
  getLocationSuggestions,
  getPropertyById,
  removePropertyImage,
  getPropertyFilters,
  addPriceHistory,
  editPriceHistory,
  deletePriceHistory,
  getPropertyInvestmentInfo,
};

/**
 * Update property status (e.g. approve or reject)
 */
async function updatePropertyStatus(id, status, adminRemark = null) {
  const propertyModel = getPropertyModel();
  
  const property = await propertyModel.findUnique({ where: { id } });
  if (!property) throw new Error("Property not found");
  
  const updatedProperty = await propertyModel.update({
    where: { id },
    data: { status }
  });
  
  return updatedProperty;
}

module.exports.updatePropertyStatus = updatePropertyStatus;
