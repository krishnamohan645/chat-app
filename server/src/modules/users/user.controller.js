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
    res.json({ message: "User blocked successfully" });
  } catch (err) {
    next(err);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    await userService.unblockUser(req.user.id, req.params.userId);
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
  console.log("REGISTER DEVICE HIT");
  console.log("req.user:", req.user);
  console.log("req.body:", req.body);

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
};
