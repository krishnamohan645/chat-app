const authValidation = (req, res, next) => {
  // console.log("BODY:", req.body);
  // console.log("FILE:", req.file);

  // 🔒 HARD SAFETY
  if (!req.body) {
    return res.status(400).json({
      message: "Request body is missing",
    });
  }

  const username = req.body.username;
  const identifier = req.body.identifier;
  const password = req.body.password;

  if (!username || !identifier || !password) {
    return res.status(400).json({
      message: "All fields required",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[6-9]\d{9}$/;

  if (!emailRegex.test(identifier) && !mobileRegex.test(identifier)) {
    return res.status(400).json({
      message: "Invalid email or mobile",
    });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters with uppercase, lowercase, number and special character",
    });
  }

  next();
};

const validateVerifyOtp = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      message: "Request body is required",
    });
  }
  const { identifier, otp } = req.body;
  if (!identifier || !otp) {
    return res.status(400).json({
      message: "Identifier and OTP are required",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[6-9]\d{9}$/;

  if (!emailRegex.test(identifier) && !mobileRegex.test(identifier)) {
    return res.status(400).json({
      message: "Invalid email or mobile",
    });
  }

  if (otp.length !== 6) {
    return res.status(400).json({
      message: "OTP must be 6 digits",
    });
  }
  next();
};

const validateResendOtp = (req, res, next) => {
  if (!req.body) {
    return res.status(400).json({
      message: "Request body is required",
    });
  }
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({
      message: "Identifier is required",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[6-9]\d{9}$/;

  if (!emailRegex.test(identifier) && !mobileRegex.test(identifier)) {
    return res.status(400).json({
      message: "Invalid email or mobile",
    });
  }

  next();
};

module.exports = { authValidation, validateVerifyOtp, validateResendOtp };
