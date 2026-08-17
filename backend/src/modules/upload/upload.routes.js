const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadController = require("./upload.controller");
const { verifyAuth } = require("../../middlewares/auth.middleware");

// Configure Multer to keep files in memory (RAM) temporarily
// Limit file size to 10MB to prevent memory bloat
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

// POST /api/v1/upload
// Requires the user to be logged in
router.post("/", verifyAuth, upload.single("file"), uploadController.uploadImage);

module.exports = router;
