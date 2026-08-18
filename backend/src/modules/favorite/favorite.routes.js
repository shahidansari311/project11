const express = require("express");
const router = express.Router();
const favoriteController = require("./favorite.controller");

router.get("/ids", favoriteController.getFavoriteIds);
router.get("/", favoriteController.getFavoriteProperties);
router.post("/:propertyId", favoriteController.toggleFavorite);

module.exports = router;
