const authRoutes = require("./src/modules/auth/auth.routes");
const userRoutes = require("./src/modules/users/user.routes");
const chatRoutes = require("./src/modules/chats/chat.routes");
const messageRoutes = require("./src/modules/messages/messages.routes");
const notificationRoutes = require("./src/modules/notifications/notifications.routes");

module.exports = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/chats/:chatId/messages", messageRoutes);
  app.use("/api/notifications", notificationRoutes);
};
