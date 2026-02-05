const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "..", "..", "uploads");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created uploads directory: ${dir}`);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "documents";

    if (file.mimetype.startsWith("image/")) folder = "images";
    if (file.mimetype.startsWith("video/")) folder = "videos";

    const uploadPath = path.join(uploadDir, folder);
    ensureDir(uploadPath);
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
    fileSize: 100 * 1024 * 1024,
  },
});

module.exports = upload;
