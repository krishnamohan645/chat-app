const jwt = require("jsonwebtoken");
const { Users } = require("../models");

const authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await Users.findByPk(decoded.userId, {
      attributes: [
        "id",
        "username",
        "email",
        "isActive",
        "isVerified",
        "mobile",
        "profile_img",
        "bio",
        "loginType",
        "lastSeen",
        "isOnline",
      ],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      isVerified: user.isVerified,
      mobile: user.mobile,
      profile_img: user.profile_img,
      bio: user.bio,
      loginType: user.loginType,
      lastSeen: user.lastSeen,
      isOnline: user.isOnline,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
