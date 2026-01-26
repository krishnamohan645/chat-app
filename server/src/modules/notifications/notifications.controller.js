const notificationSerive = require("./notifications.service");

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationSerive.getNotifications(
      req.user.id,
    );
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    await notificationSerive.markAsRead(req.params.id, req.user.id);
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationSerive.markAllAsRead(req.user.id);
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
