const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../../middlewares/auth.middleware");
const messageController = require("./messages.controller");
const upload = require("../../middlewares/upload.middleware");

router.post("/", auth, messageController.sendMessage);
router.get("/", auth, messageController.getMessages);
router.put("/:messageId", auth, messageController.editMessage);
router.delete("/:messageId", auth, messageController.deleteMessageForEveryone);
router.delete("/:messageId/me", auth, messageController.deleteMessageForMe);
router.put("/:messageId/read", auth, messageController.readMessage);
// router.post('/file', auth, messageController.sendFileMessage);
router.post(
  "/media",
  auth,
  upload.array("file", 10),
  messageController.sendFileMessage,
);
router.get('/search', auth, messageController.searchMessages)

module.exports = router;
