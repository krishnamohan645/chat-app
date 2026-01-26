const express = require("express");
const router = express.Router({mergeParams: true});
const auth = require("../../middlewares/auth.middleware");
const messageController = require("./messages.controller");

router.post("/", auth, messageController.sendMessage);
router.get('/', auth, messageController.getMessages);
router.put('/:messageId', auth, messageController.editMessage);
router.delete('/:messageId', auth, messageController.deleteMessageForEveryone);
router.delete('/:messageId/me', auth, messageController.deleteMessageForMe);
router.put('/:messageId/read', auth, messageController.readMessage);
// router.post('/file', auth, messageController.sendFileMessage);

module.exports = router;
