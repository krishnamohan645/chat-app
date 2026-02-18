const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../../middlewares/auth.middleware");
const messageController = require("./messages.controller");
const upload = require("../../middlewares/upload.middleware");

router.post("/", auth, messageController.sendMessage);
router.get("/", auth, messageController.getMessages);

// ✅ READ ROUTES FIRST
router.put("/read-all", auth, messageController.readAllMessages);
router.put("/:messageId/read", auth, messageController.readMessage);

// ✅ DELETE ME FIRST
router.delete("/:messageId/me", auth, messageController.deleteMessageForMe);

// ❗ GENERIC ROUTES LAST
router.put("/:messageId", auth, messageController.editMessage);
router.delete("/:messageId", auth, messageController.deleteMessageForEveryone);

router.post(
  "/media",
  auth,
  upload.array("file", 10),
  messageController.sendFileMessage,
);

router.post("/sticker", auth, messageController.sendSticker);

router.get("/search", auth, messageController.searchMessages);

module.exports = router;
