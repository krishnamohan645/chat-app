const verifyMiddleware = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      message: "User is not verified",
    });
  }
  next();
};

module.exports = verifyMiddleware;
