// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const uploadDir = path.join(__dirname, "..", "..", "..", "uploads");

// const ensureDir = (dir) => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//     console.log(`Created uploads directory: ${dir}`);
//   }
// };

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let folder = "documents";

//     if (file.mimetype.startsWith("image/")) folder = "images";
//     if (file.mimetype.startsWith("video/")) folder = "videos";

//     const uploadPath = path.join(uploadDir, folder);
//     ensureDir(uploadPath);
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const name = Date.now() + "-" + Math.random().toString(36).slice(2);
//     cb(null, name + ext);
//   },
// });

// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 100 * 1024 * 1024,
//   },
// });

// module.exports = upload;

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "..", "..", "uploads");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created uploads directory: ${dir}`);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "documents"; // default

    if (file.mimetype.startsWith("image/")) {
      folder = "images";
    } else if (file.mimetype.startsWith("video/")) {
      folder = "videos";
    } else if (file.mimetype.startsWith("audio/")) {
      folder = "audio";
    } else if (
      file.mimetype === "application/pdf" ||
      file.mimetype.includes("document") ||
      file.mimetype.includes("word") ||
      file.mimetype.includes("sheet") ||
      file.mimetype.includes("presentation")
    ) {
      folder = "documents";
    }

    const uploadPath = path.join(uploadDir, folder);
    ensureDir(uploadPath);

    console.log("📁 Saving file to:", uploadPath);

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.random().toString(36).slice(2);
    cb(null, name + ext);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // ✅ Allow all common file types
    const allowedTypes =
      /jpeg|jpg|png|gif|webp|bmp|svg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar|mp3|wav|ogg|m4a|mp4|mov|avi|mkv|webm/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    // Also check mimetype
    const allowedMimeTypes = [
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/svg+xml",
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
      // Archives
      "application/zip",
      "application/x-rar-compressed",
      // Audio
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      // Video
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
      "video/webm",
    ];

    const mimetypeAllowed = allowedMimeTypes.includes(file.mimetype);

    if (mimetypeAllowed || extname) {
      return cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
});

module.exports = upload;
