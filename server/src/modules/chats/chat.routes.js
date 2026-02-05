const express = require("express");
const router = express.Router();
const chatController = require("./chat.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.post("/private", authMiddleware, chatController.createPrivateChat);
router.post("/group", authMiddleware, chatController.createGroupChat);
router.get("/", authMiddleware, chatController.getMyChats);

router.get("/:chatId/members", authMiddleware, chatController.getChatMembers);
router.post("/:chatId/members", authMiddleware, chatController.addGroupMembers);
router.delete(
  "/:chatId/members/:userId",
  authMiddleware,
  chatController.removeGroupMember
);

router.post("/:chatId/leave", authMiddleware, chatController.leaveGroup);
router.put("/:chatId/mute", authMiddleware, chatController.muteChat);
router.put("/:chatId/unmute", authMiddleware, chatController.unMuteChat);
router.get('/search', authMiddleware, chatController.searchChats)
router.get("/list", authMiddleware, chatController.getChatList)

module.exports = router;
