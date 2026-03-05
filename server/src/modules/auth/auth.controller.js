const { Users } = require("../../models");
const authService = require("./auth.service");

// ✅ Helper function for consistent cookie settings
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  
  return {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? "none" : "lax", // ✅ "none" for cross-origin in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
};

const registerController = async (req, res, next) => {
  try {
    await authService.registerUser({
      ...req.body, 
      profileImg: req.file || null,
    });
    res.status(201).json({
      message: "Signup Successful. please verify OTP",
    });
  } catch (err) {
    next(err);
  }
};

const verifyOtpController = async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = await authService.VerifyOtp(req.body);

    // ✅ Use consistent cookie settings
    res.cookie("refreshToken", refreshToken, getCookieOptions());

    res.status(200).json({
      message: "OTP Verified Successfully",
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

const resendOtpController = async (req, res, next) => {
  try {
    await authService.resendOtp(req.body);
    res.status(200).json({
      message: "OTP Resent Successfully",
    });
  } catch (err) {
    next(err);
  }
};

const loginUserController = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    const { accessToken, refreshToken, user } = await authService.loginUser({
      identifier,
      password,
    });

    // ✅ Use consistent cookie settings
    res.cookie("refreshToken", refreshToken, getCookieOptions());

    res.status(200).json({
      message: "Login Successful",
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        profile_img: user.profile_img,
        loginType: user.loginType,
      },
    });
  } catch (err) {
    next(err);
  }
};

const logoutController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await authService.logoutUser(refreshToken);
    }

    await Users.update(
      {
        isOnline: false,
        lastSeen: new Date(),
      },
      { where: { id: req.user.id } },
    );

    // ✅ Clear cookie with SAME settings used to set it
    res.clearCookie("refreshToken", getCookieOptions());

    res.status(200).json({ message: "Logout Successfully" });
  } catch (err) {
    next(err);
  }
};

const refreshController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    console.log("🔄 Refresh attempt:");
    console.log("   Cookie received:", refreshToken ? "YES" : "NO");
    console.log("   Token preview:", refreshToken?.substring(0, 20));

    if (!refreshToken) {
      console.log("❌ No refresh token in cookies");
      return res.status(401).json({
        message: "Refresh token missing",
      });
    }

    const newAccessToken = await authService.refreshUser(refreshToken);
    
    if (!newAccessToken) {
      console.log("❌ Service returned no access token");
      return res.status(401).json({ 
        message: "Invalid refresh token" 
      });
    }

    console.log("✅ Refresh successful");
    return res.status(200).json({
      message: "Refresh Successful",
      accessToken: newAccessToken,
    });
  } catch (err) {
    console.error("❌ Refresh error:", err.message);
    next(err);
  }
};

const forgotPasswordController = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    await authService.forgotPassword({ identifier });

    res.status(200).json({
      message: "If the account exists, OTP has been sent",
    });
  } catch (err) {
    next(err);
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    await authService.resetPassword({ identifier, otp, newPassword });

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerController,
  verifyOtpController,
  resendOtpController,
  loginUserController,
  logoutController,
  refreshController,
  forgotPasswordController,
  resetPasswordController,
};