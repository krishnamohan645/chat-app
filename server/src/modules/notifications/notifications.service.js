const { Notification } = require("../../models");

const getNotifications = async (userId) => {
  return Notification.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
  });
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
    { where: { userId } },
  );
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
