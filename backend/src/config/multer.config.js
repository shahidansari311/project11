const multer = require("multer");

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
];

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  ...ALLOWED_IMAGE_TYPES
];

// File filter for general images (profile, property)
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype.toLowerCase())) {
    return cb(null, true);
  }
  cb(new Error("Invalid file format. Only images (JPG, PNG, WEBP, HEIC) are allowed."));
};

// File filter for documents (KYC, etc.)
const documentFileFilter = (req, file, cb) => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype.toLowerCase())) {
    return cb(null, true);
  }
  cb(new Error("Invalid file format. Only PDF documents and Images are allowed."));
};

// General Image Upload (10MB)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: imageFileFilter
});

// Document Upload (2MB)
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: documentFileFilter
});

module.exports = {
  imageUpload,
  documentUpload
};
