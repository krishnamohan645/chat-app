const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs").promises;

// ✅ Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {Object} file - Multer file object
 * @param {string} folder - Cloudinary folder path
 * @returns {Object} - File details with Cloudinary URL
 */
const uploadFile = async (file, folder = "chat-app") => {
  if (!file) {
    throw new Error("No file provided");
  }

  // Determine resource type based on file mimetype
  let resourceType = "raw"; // Default for documents
  console.log("FILE RECEIVED:", file);

  if (file.mimetype.startsWith("image/")) {
    resourceType = "image";
  } else if (file.mimetype.startsWith("video/")) {
    resourceType = "video";
  } else if (file.mimetype.startsWith("audio/")) {
    resourceType = "video"; // Cloudinary uses 'video' for audio
  }

  // Create unique filename
  const originalName = path.parse(file.originalname).name;
  const timestamp = Date.now();

  try {
    console.log(`📤 Uploading to Cloudinary: ${file.originalname}`);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder, // Organize in folders
      resource_type: resourceType,
      public_id: `${originalName}-${timestamp}`,
    });

    console.log(`✅ Uploaded: ${result.secure_url}`);

    // Delete local temporary file
    try {
      await fs.unlink(file.path);
      console.log(`🗑️ Deleted local file: ${file.path}`);
    } catch (unlinkError) {
      console.error("Failed to delete local file:", unlinkError);
    }

    // Return file details
    return {
      fileUrl: result.secure_url, // Cloudinary URL
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      cloudinaryId: result.public_id, // For deletion later
    };
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @param {string} resourceType - Type (image/video/raw)
 */
// const deleteFile = async (publicId, resourceType = "image") => {
//   if (!publicId) return;

//   try {
//     console.log(`🗑️ Deleting from Cloudinary: ${publicId}`);

//     const result = await cloudinary.uploader.destroy(publicId, {
//       resource_type: resourceType,
//     });

//     console.log(`✅ Deleted: ${result.result}`);
//     return result;
//   } catch (error) {
//     console.error("❌ Delete failed:", error);
//   }
// };

const deleteFile = async (publicId, resourceType = "auto") => {
  if (!publicId) return;

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("❌ Delete failed:", error);
  }
};

// Helper functions for different upload types
module.exports = {
  uploadFile,
  deleteFile,
  uploadProfileImage: (file) => uploadFile(file, "chat-app/profiles"),
  uploadGroupImage: (file) => uploadFile(file, "chat-app/groups"),
  uploadChatFile: (file) => uploadFile(file, "chat-app/messages"),
};
