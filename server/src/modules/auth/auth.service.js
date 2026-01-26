const bcrypt = require("bcryptjs");
const sendOtp = require("../../utils/sendOtp");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../config/jwt");
const RefreshTokens = require("../../models/refreshTokens.model");
const { Users, Otps, UserSettings } = require("../../models");
// const { jwt } = require("twilio");
const jwt = require("jsonwebtoken");

const crypto = require("crypto");
const sequelize = require("../../config/database");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const registerUser = async ({ username, identifier, password, profileImg }) => {
  const isEmail = identifier.includes("@");

  const where = isEmail ? { email: identifier } : { mobile: identifier };

  const existingUser = await Users.findOne({ where });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await Users.create({
    username,
    email: isEmail ? identifier : null,
    mobile: !isEmail ? identifier : null,
    password: hashedPassword,
    loginType: isEmail ? "email" : "mobile",
    isVerified: false,
    isActive: true,
    profile_img: profileImg,
  });

  // 👇 CREATE DEFAULT USER SETTINGS
  await UserSettings.create({
    userId: user.id,
    pushNotifications: true,
    emailNotifications: true,
  });

  //   OTP GENRATION
  const Otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(Otp, 10);

  const otpRow  = await Otps.create({
    userId: user.id,
    identifier,
    otpHash,
    purpose: "signup",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
  console.log("OTP CREATED:", {
    otp: Otp,
    identifier,
    otpRowId: otpRow.id,
  });
  await sendOtp({ identifier, otp: Otp });
};

const VerifyOtp = async ({ identifier, otp }) => {
  identifier = identifier.trim().toLowerCase();

  const isEmail = identifier.includes("@");
  const userWhere = isEmail ? { email: identifier } : { mobile: identifier };

  // 1️⃣ Find user
  const user = await Users.findOne({ where: userWhere });
  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("User already verified");
  }

  // 2️⃣ Get latest active OTP
  const otpRecord = await Otps.findOne({
    where: {
      userId: user.id,
      purpose: "signup",
      isUsed: false,
    },
    order: [["createdAt", "DESC"]],
  });

  if (!otpRecord) {
    throw new Error("Invalid or expired OTP");
  }

  // 3️⃣ Expiry check
  if (otpRecord.expiresAt < new Date()) {
    otpRecord.isUsed = true;
    await otpRecord.save();
    throw new Error("OTP expired. Please resend OTP.");
  }

  // 4️⃣ Attempt limit check
  if (otpRecord.attempts >= 5) {
    otpRecord.isUsed = true;
    await otpRecord.save();
    throw new Error("OTP attempts exceeded. Please resend OTP.");
  }

  // 5️⃣ Compare OTP
  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isMatch) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new Error("Invalid OTP");
  }

  // 6️⃣ Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  // const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const refreshTokenHash = hashToken(refreshToken);

  // 7️⃣ Transaction (CRITICAL)
  const t = await sequelize.transaction();
  try {
    // mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save({ transaction: t });

    // verify user
    await user.update({ isVerified: true }, { transaction: t });

    // store refresh token
    await RefreshTokens.create(
      {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      { transaction: t },
    );

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  return { accessToken, refreshToken };
};

const resendOtp = async ({ identifier }) => {
  identifier = identifier.trim().toLowerCase();

  const isEmail = identifier.includes("@");
  const userWhere = isEmail ? { email: identifier } : { mobile: identifier };

  // 1️⃣ Find user
  const user = await Users.findOne({ where: userWhere });
  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("User already verified");
  }

  // 2️⃣ Cooldown check (60 sec)
  const lastOtp = await Otps.findOne({
    where: {
      userId: user.id,
      purpose: "signup",
    },
    order: [["createdAt", "DESC"]],
  });

  if (
    lastOtp &&
    Date.now() - new Date(lastOtp.createdAt).getTime() < 60 * 1000
  ) {
    throw new Error("Please wait before requesting another OTP");
  }

  // 3️⃣ Invalidate old OTPs
  await Otps.update(
    { isUsed: true },
    {
      where: {
        userId: user.id,
        purpose: "signup",
        isUsed: false,
      },
    },
  );

  // 4️⃣ Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await Otps.create({
    userId: user.id,
    identifier,
    otpHash,
    purpose: "signup",
    isUsed: false,
    attempts: 0,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  // 5️⃣ Send OTP
  await sendOtp({ identifier, otp });
};

const loginUser = async ({ identifier, password }) => {
  identifier = identifier.trim().toLowerCase();

  const isEmail = identifier.includes("@");
  const where = isEmail ? { email: identifier } : { mobile: identifier };

  const user = await Users.findOne({ where });

  if (!user) {
    throw new Error("Invalid Credentials");
  }

  if (!user.isVerified) {
    throw new Error("Please Verify your account first");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid Credentials");
  }

  console.log("Creating refresh token for user:", user.id);
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  // const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const refreshTokenHash = hashToken(refreshToken);
  console.log("Refresh token (first 20 chars):", refreshToken.substring(0, 20));
  console.log(
    "Token hash (first 20 chars):",
    refreshTokenHash.substring(0, 20),
  );
  const createdToken = await RefreshTokens.create({
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  console.log("Token created in DB with ID:", createdToken.id);
  return { accessToken, refreshToken, user };
};

const logoutUser = async (refreshToken) => {
  if (!refreshToken) return;

  const tokenHash = hashToken(refreshToken);

  await RefreshTokens.destroy({
    where: { tokenHash },
  });
};

const refreshUser = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Refresh Token Missing");
  }
  const tokenHash = hashToken(refreshToken);
  const storedToken = await RefreshTokens.findOne({
    where: {
      tokenHash: tokenHash,
    },
  });
  if (!storedToken) {
    throw new Error("Invalid Refresh Token");
  }
  let payload;
  try {
    console.log("JWT_REFRESH_SECRET:", process.env.JWT_REFRESH_SECRET);
    console.log("Refresh token:", refreshToken);

    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    await RefreshTokens.destroy({
      where: {
        tokenHash,
      },
    });
    throw new Error("Refresh token Expired");
  }
  const user = await Users.findByPk(payload.id);

  if (!user) {
    throw new Error("User not found");
  }

  const newAccessToken = generateAccessToken(user);
  return newAccessToken;
};

const forgotPassword = async ({ identifier }) => {
  identifier = identifier.trim().toLowerCase();

  const isEmail = identifier.includes("@");
  const where = isEmail ? { email: identifier } : { mobile: identifier };

  const user = await Users.findOne({ where });

  if (!user) return;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  await Otps.update(
    { isUsed: true },
    {
      where: {
        userId: user.id,
        purpose: "reset_password",
        isUsed: false,
      },
    },
  );

  await Otps.create({
    userId: user.id,
    identifier,
    otpHash,
    purpose: "reset_password",
    isUsed: false,
    attempts: 0,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  await sendOtp({ identifier, otp });
};

const resetPassword = async ({ identifier, otp, newPassword }) => {
  identifier = identifier.trim().toLowerCase();

  const isEmail = identifier.includes("@");

  const where = isEmail ? { email: identifier } : { mobile: identifier };
  const user = await Users.findOne({ where });

  if (!user) throw new Error("Invalid request");

  const otpRecord = await Otps.findOne({
    where: {
      userId: user.id,
      purpose: "reset_password",
      isUsed: false,
    },
    order: [["createdAt", "DESC"]],
  });

  if (!otpRecord) throw new Error("Invalid or Expired OTP");

  if (otpRecord.expiresAt < new Date()) {
    otpRecord.isUsed = true;
    await otpRecord.save();
    throw new Error("OTP Expired");
  }

  if (otpRecord.attempts >= 5) {
    otpRecord.isUsed = true;
    await otpRecord.save();
    throw new Error("OTP attempts exceeded");
  }
  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isMatch) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new Error("Invalid OTP");
  }

  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

  if (!passwordRegex.test(newPassword)) {
    throw new Error(
      "Password must be strong (8 chars,upper, lower, number, special)",
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const t = await sequelize.transaction();

  try {
    await user.update(
      {
        password: hashedPassword,
        lastPasswordChangeAt: new Date(),
      },
      { transaction: t },
    );

    otpRecord.isUsed = true;
    await otpRecord.save({ transaction: t });

    await RefreshTokens.destroy({
      where: {
        userId: user.id,
      },
      transaction: t,
    });

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

module.exports = {
  registerUser,
  VerifyOtp,
  resendOtp,
  loginUser,
  logoutUser,
  refreshUser,
  forgotPassword,
  resetPassword,
};
