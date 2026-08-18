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

async function getAdminFavoriteStats() {
  const properties = await prisma.property.findMany({
    select: { id: true, title: true, location: true }
  });

  const stats = await Promise.all(properties.map(async (prop) => {
    const count = await prisma.user.count({
      where: { favoriteProperties: { has: prop.id } }
    });
    return { propertyId: prop.id, title: prop.title, location: prop.location, favoritesCount: count };
  }));

  // Filter out 0s if wanted, and sort by highest
  return stats.filter(s => s.favoritesCount > 0).sort((a, b) => b.favoritesCount - a.favoritesCount);
}

async function getAdminPropertyFavorites(propertyId) {
  const users = await prisma.user.findMany({
    where: { favoriteProperties: { has: propertyId } },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      profileUrl: true,
      hasPurchasedProperty: true,
      createdAt: true
    }
  });
  return users;
}

async function getAdminUserFavorites(userId) {
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
  
  return properties;
}

module.exports = {
  toggleFavorite,
  getFavoriteIds,
  getFavoriteProperties,
  getAdminFavoriteStats,
  getAdminPropertyFavorites,
  getAdminUserFavorites
};
