const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const authRateLimiter = require("../../middlewares/rateLimiter.middleware");
const {
  authValidation,
  validateVerifyOtp,
  validateResendOtp,
} = require("../../middlewares/validation.middleware");
const upload = require("../../middlewares/upload.middleware");
const protect = require("../../middlewares/protect.middleware");

router.post(
  "/register",
  authRateLimiter,
  upload.single("profile_img"),
  authValidation,
  authController.registerController
);

router.post(
  "/verify-otp",
  validateVerifyOtp,
  authRateLimiter,
  authController.verifyOtpController
);

router.post(
  "/resend-otp",
  validateResendOtp,
  authRateLimiter,
  authController.resendOtpController
);

router.post("/login", authRateLimiter, authController.loginUserController);
router.post("/logout", protect, authController.logoutController);
router.post("/refresh", authController.refreshController);
router.post("/forgot-password", authController.forgotPasswordController);
router.post("/reset-password", authController.resetPasswordController);

module.exports = router;
