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

module.exports = {
  toggleFavorite,
  getFavoriteIds,
  getFavoriteProperties
};
