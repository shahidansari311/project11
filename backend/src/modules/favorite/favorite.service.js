const prisma = require("../../config/db");
const AppError = require("../../utils/AppError");

async function toggleFavorite(userId, propertyId) {
  // Check if property exists
  const property = await prisma.property.findUnique({
    where: { id: propertyId }
  });
  if (!property) {
    throw new AppError("Property not found", 404);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { favoriteProperties: true }
  });

  const favorites = user.favoriteProperties || [];
  const isFavorited = favorites.includes(propertyId);

  let newFavorites;
  if (isFavorited) {
    // Remove it
    newFavorites = favorites.filter(id => id !== propertyId);
  } else {
    // Add it
    newFavorites = [...favorites, propertyId];
  }

  await prisma.user.update({
    where: { id: userId },
    data: { favoriteProperties: newFavorites }
  });

  return { favorited: !isFavorited };
}

async function getFavoriteIds(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { favoriteProperties: true }
  });
  return user?.favoriteProperties || [];
}

async function getFavoriteProperties(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { favoriteProperties: true }
  });

  const favoriteIds = user?.favoriteProperties || [];
  if (favoriteIds.length === 0) return [];

  const properties = await prisma.property.findMany({
    where: {
      id: { in: favoriteIds }
    }
  });
  
  // Sort properties to maintain order (optional, but good) or just return
  return properties;
}

async function getAdminFavoriteStats({ page = 1, limit = 20, search = "" } = {}) {
  const skip = (page - 1) * limit;

  const where = search.trim()
    ? {
        OR: [
          { title: { contains: search.trim(), mode: "insensitive" } },
          { location: { contains: search.trim(), mode: "insensitive" } },
        ],
      }
    : {};

  const properties = await prisma.property.findMany({
    where,
    select: { id: true, title: true, location: true }
  });

  const stats = await Promise.all(properties.map(async (prop) => {
    const count = await prisma.user.count({
      where: { favoriteProperties: { has: prop.id } }
    });
    return { propertyId: prop.id, title: prop.title, location: prop.location, favoritesCount: count };
  }));

  const filteredStats = stats.filter(s => s.favoritesCount > 0).sort((a, b) => b.favoritesCount - a.favoritesCount);
  const total = filteredStats.length;
  const paginatedStats = filteredStats.slice(skip, skip + limit);

  return {
    stats: paginatedStats,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    }
  };
}

async function getAdminPropertyFavorites(propertyId, { page = 1, limit = 20, search = "" } = {}) {
  const skip = (page - 1) * limit;

  const searchWhere = search.trim()
    ? {
        OR: [
          { fullName: { contains: search.trim(), mode: "insensitive" } },
          { email: { contains: search.trim(), mode: "insensitive" } },
          { phone: { contains: search.trim(), mode: "insensitive" } }
        ],
      }
    : {};

  const where = {
    AND: [
      { favoriteProperties: { has: propertyId } },
      searchWhere
    ]
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        profileUrl: true,
        hasPurchasedProperty: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where })
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    }
  };
}

async function getAdminUserFavorites(userId, { page = 1, limit = 20, search = "" } = {}) {
  const skip = (page - 1) * limit;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { favoriteProperties: true }
  });

  const favoriteIds = user?.favoriteProperties || [];
  if (favoriteIds.length === 0) {
    return { properties: [], pagination: { total: 0, page, limit, totalPages: 0, hasNext: false, hasPrev: false } };
  }

  const searchWhere = search.trim()
    ? {
        OR: [
          { title: { contains: search.trim(), mode: "insensitive" } },
          { location: { contains: search.trim(), mode: "insensitive" } },
        ],
      }
    : {};

  const where = {
    AND: [
      { id: { in: favoriteIds } },
      searchWhere
    ]
  };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.property.count({ where })
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
    }
  };
}

module.exports = {
  toggleFavorite,
  getFavoriteIds,
  getFavoriteProperties,
  getAdminFavoriteStats,
  getAdminPropertyFavorites,
  getAdminUserFavorites
};
