const { Server } = require("socket.io");
const { Devices, Users, MessageStatus, Messages } = require("../models");

let io;

// userId -> active socket count
const onlineUsers = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", async (socket) => {
    console.log("User Connected:", socket.id);

    // CHAT ROOMS
    socket.on("join-chat", async (chatId) => {
      socket.join(`chat-${chatId}`);

      await MessageStatus.update(
        { status: "delivered" },
        {
          where: {
            userId: socket.userId,
            status: "sent",
          },
          include: [
            {
              model: Messages,
              where: {
                chatId,
              },
            },
          ],
        },
      );
    });

    socket.on("leave-chat", (chatId) => {
      socket.leave(`chat-${chatId}`);
    });

    // USER ROOM (notifications)
    socket.on("join-user", (userId) => {
      socket.join(`user-${userId}`);
    });

    // HANDSHAKE AUTH (presence)
    const userId = socket.handshake.auth?.userId;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.userId = userId;

    console.log("socket connected userId:", userId);

    // ONLINE LOGIC (FIXED)
    const count = (onlineUsers.get(userId) || 0) + 1;
    onlineUsers.set(userId, count);

    if (count === 1) {
      await Users.update({ isOnline: true }, { where: { id: userId } });

      await MessageStatus.update(
        { status: "delivered" },
        {
          where: {
            userId,
            status: "sent",
          },
        },
      );

      socket.broadcast.emit("user-online", userId);
    }

    // OPTIONAL DEVICE TRACKING
    socket.on("register-device", ({ deviceId }) => {
      socket.deviceId = deviceId;
    });

    // TYPING INDICATOR
    socket.on("typing:start", ({ chatId }) => {
      if (!socket.userId) return;
      socket.to(`chat-${chatId}`).emit("typing:start", {
        chatId,
        userId: socket.userId,
      });
    });

    socket.on("typing:stop", ({ chatId }) => {
      if (!socket.userId) return;
      socket.to(`chat-${chatId}`).emit("typing:stop", {
        chatId,
        userId: socket.userId,
      });
    });

    // DISCONNECT (FIXED)
    socket.on("disconnect", async () => {
      console.log("User Disconnected:", socket.id);

      const current = (onlineUsers.get(userId) || 1) - 1;

      if (current <= 0) {
        onlineUsers.delete(userId);

        await Users.update(
          {
            isOnline: false,
            lastSeen: new Date(),
          },
          { where: { id: userId } },
        );

        // update device last seen (if exists)
        if (socket.deviceId) {
          await Devices.update(
            { lastSeen: new Date() },
            { where: { id: socket.deviceId } },
          );
        }

        socket.broadcast.emit("user-offline", userId);
      } else {
        onlineUsers.set(userId, current);
      }
    });
  });
};

const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
};
