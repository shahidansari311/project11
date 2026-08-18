const express = require("express");
const router = express.Router();
const multer = require("multer");
const documentController = require("./document.controller");
const { validate } = require("../../middlewares/validate.middleware");
const { uploadDocumentSchema, adminUpdateDocumentStatusSchema } = require("./document.validation");
const { uploadDocumentFile } = require("../../middlewares/upload.middleware");
const { verifyAuth } = require("../../middlewares/auth.middleware");
const { requireRole } = require("../../middlewares/role.middleware");

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp", "heic", "heif"];

// Configure Multer for single document file upload with strict 2MB limit and PDF/Image format restriction
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // Strict 2MB limit per file
  fileFilter: (req, file, cb) => {
    const ext = (file.originalname.split(".").pop() || "").toLowerCase();
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase());
    const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

    if (isMimeAllowed && isExtAllowed) {
      return cb(null, true);
    }

    cb(
      new Error(
        "Invalid file format. Only PDF documents and Images (JPG, PNG, WEBP) are allowed. Text and Office files are not permitted."
      )
    );
  },
});

// Middleware wrapper to return clean 400 JSON errors for file size or format violations
const handleMulterError = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File size exceeds the 2MB limit. Please upload a file smaller than 2MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }
    // Ensure req.body is always an object after multer parsing
    if (!req.body) req.body = {};
    next();
  });
};

// User document routes (protected for registered users and testing admin)
router.post(
  "/user/document",
  verifyAuth,
  requireRole("user", "admin"),
  handleMulterError,
  uploadDocumentFile,
  validate(uploadDocumentSchema),
  documentController.uploadDocument
);

router.get(
  "/user/document",
  verifyAuth,
  requireRole("user", "admin"),
  documentController.getDocumentStatus
);

module.exports = router;
