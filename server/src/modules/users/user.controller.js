const { getIO } = require("../../socket/socket");
const userService = require("./user.service");

const getMyProfile = async (req, res, next) => {
  try {
    const user = await userService.getMyProfile(req.user.id);
    console.log(user, "user");
    res.status(200).json({
      user,
      message: "Profile fetched successfully",
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      profile_img: req.file
        ? `/uploads/images/${req.file.filename}`
        : undefined,
    };
    const user = await userService.updateProfile(req.user.id, data);
    res.status(200).json({
      user,
      message: "Profile updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await userService.changePassword(req.user.id, req.body);
    res.json({
      message: "Password changed successfully",
    });
  } catch (err) {
    next(err);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const users = await userService.listUsers(req.user.id, req.query);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const getOnlineUsers = async (req, res, next) => {
  try {
    const users = await userService.getOnlineUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    await userService.updateStatus(req.user.id, req.body.statusMessage);
    res.json({ message: "Status updated" });
  } catch (err) {
    next(err);
  }
};

const getUserPresence = async (req, res, next) => {
  try {
    const presence = await userService.getUserPresence(req.params.id);
    res.json(presence);
  } catch (err) {
    next(err);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const users = await userService.searchUsers(req.query.search, req.user.id);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const blockUser = async (req, res, next) => {
  try {
    await userService.blockUser(req.user.id, req.params.userId);

    const io = getIO();

    // Notify the blocker's clients to refresh
    io.to(`user-${req.user.id}`).emit("block-status-changed", {
      blockedUserId: Number(req.params.userId),
      isBlocked: true,
    });

    // Notify the blocked user
    io.to(`user-${req.params.userId}`).emit("blocked-by-user", {
      blockerId: req.user.id,
    });

    res.json({ message: "User blocked successfully" });
  } catch (err) {
    next(err);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    await userService.unblockUser(req.user.id, req.params.userId);

    const io = getIO();

    // Notify the unblocker's clients to refresh
    io.to(`user-${req.user.id}`).emit("block-status-changed", {
      blockedUserId: Number(req.params.userId),
      isBlocked: false,
    });

    // Notify the unblocked user
    io.to(`user-${req.params.userId}`).emit("unblocked-by-user", {
      blockerId: req.user.id,
    });

    res.json({ message: "User unblocked successfully" });
  } catch (err) {
    next(err);
  }
};

const blockedUsers = async (req, res, next) => {
  try {
    const users = await userService.blockedUsers(req.user.id);
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

const registerDevice = async (req, res, next) => {
  // console.log("REGISTER DEVICE HIT");
  // console.log("req.user:", req.user);
  // console.log("req.body:", req.body);

  try {
    const { deviceType, pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ message: "pushToken required" });
    }

    await userService.registerDevice(req.user.id, deviceType, pushToken);

    res.status(201).json({
      success: true,
      message: "Device registered successfully",
    });
  } catch (err) {
    next(err);
  }
};

const getUserProfile = async (req, res, next) => {
  console.log("getUserProfile hit");
  try {
    const targetUserId = Number(req.params.userId);
    const requesterId = req.user.id;

    // optional: block self via this route
    if (targetUserId === requesterId) {
      return res.status(400).json({
        message: "Use /users/me for your own profile",
      });
    }

    const user = await userService.getUserProfile(targetUserId, requesterId);
    res.status(200).json({
      user,
      message: "User profile fetched successfully",
    });
  } catch (err) {
    console.log("Error in get user controller:", err);
    next(err);
  }
};

module.exports = {
  getMyProfile,
  updateProfile,
  changePassword,
  listUsers,
  getOnlineUsers,
  updateStatus,
  getUserPresence,
  searchUsers,
  blockUser,
  unblockUser,
  blockedUsers,
  registerDevice,
  getUserProfile,
};
