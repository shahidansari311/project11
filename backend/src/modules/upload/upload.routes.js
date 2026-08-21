const express = require("express");
const router = express.Router();
const { imageUpload } = require("../../config/multer.config");
const uploadController = require("./upload.controller");
const { verifyAuth } = require("../../middlewares/auth.middleware");

// POST /api/v1/upload
// Requires the user to be logged in
router.post("/", verifyAuth, imageUpload.single("file"), uploadController.uploadImage);

module.exports = router;
