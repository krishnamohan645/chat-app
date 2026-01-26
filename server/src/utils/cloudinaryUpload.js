// const cloudinary = require("cloudinary").v2;
// require("dotenv").config();

// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env._API_SECRET, // Click 'View API Keys' above to copy your API secret
// });

// const uploadFile = async (file, folder = "chat-app") => {
//   if (!file) {
//     throw new Error("No file provided");
//   }

//   const mimetype = file.mimetype;

//   // Decide resource type
//   let resourceType = "raw";
//   if (mimetype.startsWith("image/")) {
//     resourceType = "image";
//   }

//   const originalName = path.parse(file.originalFilename).name;

//   const result = await cloudinary.uploader.upload(file.path, {
//     folder,
//     resource_type: resourceType,
//     public_id: `${originalName}-${Date.now()}}`,
//   });

//   return {
//     fileUrl: result.secure_url,
//     fileName: file.originalName,
//     fileSize: file.size,
//     mimeType: file.mimetype,
//   };
// };

// module.exports = uploadFile;
