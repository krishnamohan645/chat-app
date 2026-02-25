const { Notification, Users } = require("../../models");

const getNotifications = async (userId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const { rows, count } = await Notification.findAndCountAll({
    where: { userId },
    include: [
      {
        model: Users,
        as: "sender",
        attributes: ["id", "username", "profile_img"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  const unreadCount = await Notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return {
    notifications: rows,
    totalNotifications: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    unreadCount,
  };
};

const markAsRead = async (id, userId) => {
  await Notification.update(
    {
      isRead: true,
    },
    { where: { id, userId } },
  );
};

const markAllAsRead = async (userId) => {
  await Notification.update(
    {
      isRead: true,
    },
    { where: { userId, isRead: false } },
  );
};

const getUnreadCount = async (userId) => {
  return Notification.count({
    where: { userId, isRead: false },
  });
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
