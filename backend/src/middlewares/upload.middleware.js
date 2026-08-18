const storageService = require("../services/storage.service");

/**
 * Middleware that intercepts multer file buffers, uploads them to Supabase, 
 * and attaches the resulting URLs to req.body.images so Zod validation can proceed.
 */
async function uploadPropertyImages(req, res, next) {
  try {
    // Ensure existing text-based image URLs sent in the form are converted to an array
    let existingImages = req.body.images;
    
    if (existingImages === "") {
      existingImages = [];
      req.body.clearImages = true; // Tell the service to NOT auto-merge old images
    } else {
      existingImages = existingImages || [];
      if (!Array.isArray(existingImages)) {
        existingImages = [existingImages];
      }
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

/**
 * Middleware that intercepts document file(s) (frontImage, backImage, or file),
 * uploads them to Supabase, and attaches the resulting URLs to req.body.
 */
async function uploadDocumentFile(req, res, next) {
  try {
    const frontFile = (req.files && (req.files.frontImage?.[0] || req.files.front?.[0] || req.files.file?.[0])) || req.file;
    const backFile = req.files && (req.files.backImage?.[0] || req.files.back?.[0]);

    // Upload front image if present
    if (frontFile) {
      console.log(`📄 [DOCUMENT UPLOAD] Uploading front image: ${frontFile.originalname} (${(frontFile.size / 1024).toFixed(1)} KB)`);
      const frontImageUrl = await storageService.uploadFile(
        frontFile.buffer,
        frontFile.originalname,
        frontFile.mimetype,
        "documents"
      );
      req.body.frontImageUrl = frontImageUrl;
      req.body.documentUrl = frontImageUrl;
      console.log(`✅ [DOCUMENT UPLOAD] Front Image Success: ${frontImageUrl}`);
    }

    // Upload back image if present
    if (backFile) {
      console.log(`📄 [DOCUMENT UPLOAD] Uploading back image: ${backFile.originalname} (${(backFile.size / 1024).toFixed(1)} KB)`);
      const backImageUrl = await storageService.uploadFile(
        backFile.buffer,
        backFile.originalname,
        backFile.mimetype,
        "documents"
      );
      req.body.backImageUrl = backImageUrl;
      console.log(`✅ [DOCUMENT UPLOAD] Back Image Success: ${backImageUrl}`);
    }

    next();
  } catch (error) {
    console.error(`❌ [DOCUMENT UPLOAD] Failed:`, error.message);
    return res.status(500).json({
      success: false,
      message: `Document upload failed: ${error.message}`,
    });
  }
}

module.exports = { uploadPropertyImages, uploadProfileImage, uploadDocumentFile };
