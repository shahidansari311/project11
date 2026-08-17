const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
const AppError = require("../utils/AppError");

// Connect using the Service Role Key to bypass RLS policies for server-side uploads
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

/**
 * Upload a file buffer to Supabase Storage
 * @param {Buffer} fileBuffer - The file data
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File mime type (e.g. image/jpeg)
 * @param {string} folder - Folder name in the bucket
 * @returns {Promise<string>} Public URL of the uploaded image
 */
async function uploadFile(fileBuffer, originalName, mimetype, folder = "general") {
  if (!supabase) {
    throw new AppError("Supabase Storage is not configured on the server. Please add SUPABASE_URL and SUPABASE_SERVICE_KEY.", 500);
  }

  // Generate unique filename to prevent collisions
  const ext = originalName.split('.').pop();
  const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;

  // Upload to the 'uploads' bucket
  const { data, error } = await supabase.storage
    .from("uploads")
    .upload(fileName, fileBuffer, {
      contentType: mimetype,
      upsert: false
    });

  if (error) {
    throw new AppError(`Failed to upload image to storage: ${error.message}`, 500);
  }

  // Retrieve the public URL
  const { data: publicUrlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
  
  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new AppError("Failed to retrieve public URL for uploaded image.", 500);
  }

  return publicUrlData.publicUrl;
}

module.exports = { uploadFile };
