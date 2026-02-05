const fs = require("fs");

const deleteFileIfExists = (filePath) => {
  if (!filePath) return;

  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("File delete failed:", err);
    }
  });
};

module.exports = { deleteFileIfExists };
