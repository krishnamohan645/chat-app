const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth.middleware");
const notificationController = require("./notifications.controller");

router.get("/", auth, notificationController.getNotifications);
router.put("/:id/read", auth, notificationController.markAsRead);
router.put("/read-all", auth, notificationController.markAllAsRead);

module.exports = router;
