const express = require("express");
const router = express.Router();
const userController = require("./user.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const upload = require("../../middlewares/upload.middleware");

router.get("/me", authMiddleware, userController.getMyProfile);
router.put(
  "/me",
  authMiddleware,
  upload.single("profile_img"),
  userController.updateProfile,
);
router.put("/change-password", authMiddleware, userController.changePassword);

router.get("/online", authMiddleware, userController.getOnlineUsers);
router.get("/", authMiddleware, userController.listUsers);

router.put("/status", authMiddleware, userController.updateStatus);
router.get("/search", authMiddleware, userController.searchUsers);
router.get("/:id/presence", authMiddleware, userController.getUserPresence);
router.post("/:userId/block", authMiddleware, userController.blockUser);
router.delete("/:userId/block", authMiddleware, userController.unblockUser);
router.get("/blocked", authMiddleware, userController.blockedUsers);
router.post("/device", authMiddleware, userController.registerDevice);

module.exports = router;
