const favoriteService = require("./favorite.service");
const { successResponse } = require("../../utils/apiResponse");

async function toggleFavorite(req, res, next) {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;
    const result = await favoriteService.toggleFavorite(userId, propertyId);
    const message = result.favorited ? "Property added to favorites" : "Property removed from favorites";
    return successResponse(res, 200, result, message);
  } catch (error) {
    next(error);
  }
}

async function getFavoriteIds(req, res, next) {
  try {
    const userId = req.user.id;
    const ids = await favoriteService.getFavoriteIds(userId);
    return successResponse(res, 200, ids, "Favorite IDs fetched successfully");
  } catch (error) {
    next(error);
  }
}

async function getFavoriteProperties(req, res, next) {
  try {
    const userId = req.user.id;
    const properties = await favoriteService.getFavoriteProperties(userId);
    return successResponse(res, 200, properties, "Favorite properties fetched successfully");
  } catch (error) {
    next(error);
  }
}

async function getAdminFavoriteStats(req, res, next) {
  try {
    const stats = await favoriteService.getAdminFavoriteStats();
    return successResponse(res, 200, stats, "Favorite stats fetched successfully");
  } catch (error) {
    next(error);
  }
}

async function getAdminPropertyFavorites(req, res, next) {
  try {
    const { propertyId } = req.params;
    const users = await favoriteService.getAdminPropertyFavorites(propertyId);
    return successResponse(res, 200, users, "Users who favorited this property fetched successfully");
  } catch (error) {
    next(error);
  }
}

async function getAdminUserFavorites(req, res, next) {
  try {
    const { userId } = req.params;
    const properties = await favoriteService.getAdminUserFavorites(userId);
    return successResponse(res, 200, properties, "User's favorite properties fetched successfully");
  } catch (error) {
    next(error);
  }
}

async function toggleFavoriteByAdmin(req, res, next) {
  try {
    const { userId, propertyId } = req.params;
    const result = await favoriteService.toggleFavorite(userId, propertyId);
    const message = result.favorited ? "Property added to user's favorites by Admin" : "Property removed from user's favorites by Admin";
    return successResponse(res, 200, result, message);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  toggleFavorite,
  getFavoriteIds,
  getFavoriteProperties,
  getAdminFavoriteStats,
  getAdminPropertyFavorites,
  getAdminUserFavorites,
  toggleFavoriteByAdmin
};
