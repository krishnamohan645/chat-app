const { Op } = require("sequelize");
const { Users } = require("../../models");
const bcrypt = require("bcryptjs");

const getMyProfile = async (userId) => {
  const user = await Users.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });

  if (!user) throw new Error("User not found");
  return user;
};

const updateProfile = async (userId, data) => {
  const { username, bio, profile_img } = data;

  await Users.update(
    {
      username,
      bio,
      profile_img,
    },
    {
      where: {
        id: userId,
      },
    },
  );
  return await Users.findByPk(userId, {
    attributes: { exclude: ["password"] },
  });
};

const changePassword = async (userId, data) => {
  const { currentPassword, newPassword } = data;

  // Validate required fields
  if (!currentPassword || !newPassword) {
    throw new Error("Current password and new password are required");
  }

  // Find user
  const user = await Users.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Check if passwords are different
  if (currentPassword === newPassword) {
    throw new Error("New password must be different from current password");
  }

  // Validate password strength
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  if (!strongPasswordRegex.test(newPassword)) {
    throw new Error(
      "Password must be at least 8 characters, include uppercase, lowercase, number and special character",
    );
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user
  await Users.update(
    {
      password: hashedPassword,
      lastPasswordChangedAt: new Date(),
    },
    {
      where: { id: userId },
    },
  );
};
const listUsers = async (currentUserId, query) => {
  const { search = "", page = 1, limit = 20 } = query;

  const offset = (page - 1) * limit;

  const users = await Users.findAll({
    where: {
      id: { [Op.ne]: currentUserId },
      username: { [Op.like]: `%${search}%` },
    },
    atteributes: ["id", "username", "profile_img", "isOnline", "lastSeen"],
    limit: Number(limit),
    offset,
  });
  return users;
};

const getOnlineUsers = async () => {
  return await Users.findAll({
    where: { isOnline: true },
    attributes: ["id", "username", "profile_img"],
  });
};

const updateStatus = async (userId, statusMessage) => {
  await Users.update({ statusMessage }, { where: { id: userId } });
};

const getUserPresence = async (userId) => {
  const user = await Users.findByPk(userId, {
    attributes: ["id", "username", "profile_img", "isOnline", "lastSeen"],
  });
  if (!user) throw new Error("User not found");
  return user;
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
