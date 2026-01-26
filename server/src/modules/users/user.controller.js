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
    const user = await userService.updateProfile(req.user.id, req.body);
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

module.exports = {
  getMyProfile,
  updateProfile,
  changePassword,
  listUsers,
  getOnlineUsers,
  updateStatus,
  getUserPresence,
};
