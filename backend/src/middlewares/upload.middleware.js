const storageService = require("../services/storage.service");

/**
 * Middleware that intercepts multer file buffers, uploads them to Supabase, 
 * and attaches the resulting URLs to req.body.images so Zod validation can proceed.
 */
async function uploadPropertyImages(req, res, next) {
  try {
    // Ensure existing text-based image URLs sent in the form are converted to an array
    let existingImages = req.body.images || [];
    if (!Array.isArray(existingImages)) {
      existingImages = [existingImages];
    }
    req.body.images = existingImages;

    if (!req.files || req.files.length === 0) {
      // If no new files were provided, pass control to Zod.
      return next(); 
    }

    // Process all files in parallel for speed
    const uploadPromises = req.files.map(file => 
      storageService.uploadFile(file.buffer, file.originalname, file.mimetype, "properties")
    );
    


    const imageUrls = await Promise.all(uploadPromises);

    // Attach the Supabase public URLs combined with existing URLs to req.body
    // This perfectly matches what Zod expects (an array of URL strings)
    req.body.images = [...existingImages, ...imageUrls];

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware that intercepts a single multer file buffer (req.file), uploads it to Supabase,
 * and attaches the resulting URL to req.body.profileImage so Zod validation can proceed.
 */
async function uploadProfileImage(req, res, next) {
  try {
    if (!req.file) {
      // Pass control to Zod if no file was uploaded (e.g. text-only update)
      return next();
    }

    const imageUrl = await storageService.uploadFile(
      req.file.buffer, 
      req.file.originalname, 
      req.file.mimetype, 
      "profiles"
    );

    // Attach to req.body so Zod validates it properly
    req.body.profileImage = imageUrl;

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadPropertyImages, uploadProfileImage };
