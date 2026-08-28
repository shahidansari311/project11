const prisma = require("../../config/db");

// Helper to access Property model safely regardless of Prisma Client client casing
const getPropertyModel = () => {
  const model = prisma.property || prisma.Property;
  if (!model) {
    throw new Error("Property model not found on Prisma Client. Please run 'npx prisma generate'.");
  }
  return model;
};

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
  minInvestment,
  totalPrice,
  totalSize,
  category,
}) {
  const property = await getPropertyModel().create({
    data: {
      title,
      description,
      images,       // String[] — array of image URLs
      location,
      status:       status ?? "AVAILABLE",
      targetReturn,
      minInvestment,
      investors:    0,  // always starts at 0
      totalPrice,
      totalSize,
      category,
    },
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

  const updatedProperty = await propertyModel.update({
    where: { id },
    data,
  });

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

async function getAllProperties({ page = 1, limit = 20, status, category, search = "", minPrice, maxPrice, location, area } = {}) {
  const skip = (page - 1) * limit;
  const propertyModel = getPropertyModel();

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (location) where.location = location;
  if (area) where.totalSize = area;
  
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

module.exports = {
  createProperty,
  updateProperty,
  deleteProperty,
  getAllProperties,
  getPropertyById,
  removePropertyImage,
  getPropertyFilters,
};
