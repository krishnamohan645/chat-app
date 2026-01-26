const authService = require("./auth.service");

const registerController = async (req, res, next) => {
  try {
    await authService.registerUser({
      ...req.body,
      profileImg: req.file ? req.file.path : null,
    });
    res.status(201).json({
      message: "Signup Successful. please verify OTP",
    });
  } catch (err) {
    // res.status(400).json({
    //   message: err.message,
    // });
    next(err);
  }
};

const verifyOtpController = async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = await authService.VerifyOtp(req.body);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

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

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
      secure: process.env.NODE_ENV === "production", // ✅ FIX
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/", // ✅ IMPORTANT
    });

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
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: isProduction ? "strict" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return res.status(200).json({
      message: "Logout Successfully",
    });
  } catch (err) {
    next(err);
  }
};

const refreshController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const newAccessToken = await authService.refreshUser(refreshToken);

    return res.status(200).json({
      message: "Refresh Successful",
      accessToken: newAccessToken,
    });
  } catch (err) {
    next(err);
  }
};

const forgotPasswordController = async (req, res) => {
  const { identifier } = req.body;
  await authService.forgotPassword({ identifier });

  res.status(200).json({
    message: "If the account exist, OTP has been sent",
  });
};

const resetPasswordController = async (req, res) => {
  const { identifier, otp, newPassword  } = req.body;
  await authService.resetPassword({ identifier, otp, newPassword  });

  res.status(200).json({
    message: "Password reset successfully",
  });
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
