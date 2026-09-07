const express = require("express");
const router = express.Router();
const { imageUpload } = require("../../config/multer.config");
const uploadController = require("./upload.controller");
const { verifyAuth } = require("../../middlewares/auth.middleware");

// POST /api/v1/upload
// Requires the user to be logged in
router.post("/", verifyAuth, imageUpload.single("file"), uploadController.uploadImage);

// POST /api/v1/upload/document
// Used for payment proofs (PDF, PNG, JPG)
const { documentUpload } = require("../../config/multer.config");
router.post("/document", verifyAuth, documentUpload.single("file"), uploadController.uploadDocument);

module.exports = router;
