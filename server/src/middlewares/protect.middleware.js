const jwt = require("jsonwebtoken");
const { Users } = require("../models");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];
    // 🔍 DEBUG (keep for now)
    console.log("ACCESS TOKEN:", token);
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  console.log("DECODED TOKEN:", decoded);
    const user = await Users.findByPk(decoded.userId, {
      attributes: ["id", "username", "email", "isActive"],
    });
    console.log(user, "user in protect");
    if (!user || user.isActive !== true) {
      return res.status(400).json({
        message: "User not Authorized",
      });
    }
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired access token",
    });
  }
};

module.exports = protect;
