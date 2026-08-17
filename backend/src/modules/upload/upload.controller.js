const storageService = require("../../services/storage.service");
const { successResponse } = require("../../utils/apiResponse");
const AppError = require("../../utils/AppError");

/**
 * POST /api/v1/upload
 * Generic endpoint to upload an image. Returns the public URL.
 */
async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError("No image file provided in the request. Please send a 'file' field.", 400);
    }

    // Determine the folder based on an optional query parameter (e.g. ?folder=profiles)
    const folder = req.query.folder || "general";

    // Upload using our Supabase service
    const publicUrl = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    return successResponse(res, 200, { url: publicUrl }, "Image uploaded successfully");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadImage
};
