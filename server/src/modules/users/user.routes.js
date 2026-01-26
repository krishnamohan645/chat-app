const express = require("express");
const router = express.Router();
const userController = require("./user.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/me", authMiddleware, userController.getMyProfile);
router.put("/me", authMiddleware, userController.updateProfile);
router.put("/change-password", authMiddleware, userController.changePassword);

router.get("/online", authMiddleware, userController.getOnlineUsers);
router.get("/", authMiddleware, userController.listUsers);

router.put("/status", authMiddleware, userController.updateStatus);
router.get('/:id/presence', authMiddleware, userController.getUserPresence);

module.exports = router;
