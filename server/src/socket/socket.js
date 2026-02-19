const { Server } = require("socket.io");
const { Devices, Users, MessageStatus, Messages, Call } = require("../models");
const { sendPushToUser } = require("../services/push.service");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

let io;

// userId -> active socket count
const onlineUsers = new Map();

// callId -> {callerId, receiverId}
const activeCalls = new Map();

const getUserSocketId = (userId) => {
  if (!io) return null;
  for (const [socketId, socket] of io.sockets.sockets) {
    if (socket.userId === userId) {
      return socketId;
    }
  }
  return null;
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  // Add authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.userId;
      socket.user = decoded;

      next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    console.log("✅ SOCKET CONNECTED");
    console.log("socket.id:", socket.id);
    console.log("socket.userId:", socket.userId);

    socket.onAny((event, data) => {
      console.log("SOCKET EVENT:", event, data);
    });

    socket.join(`user-${socket.userId}`);
    console.log(`👤 User ${socket.userId} joined their user room`);

    // ============================================
    // CHAT ROOMS - JOIN CHAT
    // ============================================
    socket.on("join-chat", async (chatId) => {
      console.log(`📥 User ${socket.userId} joining chat ${chatId}`);
      console.log(
        "👥 Room members:",
        io.sockets.adapter.rooms.get(`chat-${chatId}`),
      );

      socket.join(`chat-${chatId}`);

      // ✅ Step 1: Mark as delivered
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

      // ✅ Step 2: Mark as read
      await MessageStatus.update(
        { status: "read" },
        {
          where: {
            userId: socket.userId,
            status: { [Op.ne]: "read" },
          },
          include: [
            {
              model: Messages,
              required: true,
              where: { chatId },
            },
          ],
        },
      );

      // ✅ Step 3: Notify other users in chat
      socket.to(`chat-${chatId}`).emit("message-delivered", {
        chatId,
        userId: socket.userId,
      });

      socket.to(`chat-${chatId}`).emit("messages-read", {
        chatId: chatId,
        readerId: socket.userId,
      });

      console.log(`✅ Messages marked as read for chat ${chatId}`);
    });

    // ============================================
    // MESSAGE READ (SEPARATE EVENT)
    // ============================================
    socket.on("messages-read", async ({ chatId }) => {
      console.log(
        `📖 User ${socket.userId} marking messages as read in chat ${chatId}`,
      );

      try {
        await MessageStatus.update(
          { status: "read" },
          {
            where: {
              userId: socket.userId,
              status: { [Op.ne]: "read" },
            },
            include: [
              {
                model: Messages,
                required: true,
                where: { chatId },
              },
            ],
          },
        );

        // 🔔 NOTIFY SENDER(S) that messages were read
        socket.to(`chat-${chatId}`).emit("messages-read", {
          chatId: chatId,
          readerId: socket.userId,
        });

        console.log(`✅ messages-read event emitted for chat ${chatId}`);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // ============================================
    // LEAVE CHAT
    // ============================================
    socket.on("leave-chat", (chatId) => {
      socket.leave(`chat-${chatId}`);
      console.log(`📤 User ${socket.userId} left chat ${chatId}`);
    });

    // USER ROOM (notifications)
    socket.on("join-user", () => {
      socket.join(`user-${socket.userId}`);
    });

    // Use socket.userId from JWT middleware
    console.log("socket connected userId:", socket.userId);

    // ONLINE LOGIC (FIXED)
    const count = (onlineUsers.get(socket.userId) || 0) + 1;
    onlineUsers.set(socket.userId, count);

    if (count === 1) {
      await Users.update({ isOnline: true }, { where: { id: socket.userId } });

      await MessageStatus.update(
        { status: "delivered" },
        {
          where: {
            userId: socket.userId,
            status: "sent",
          },
        },
      );

      socket.broadcast.emit("user-online", socket.userId);
    }

    // OPTIONAL DEVICE TRACKING
    socket.on("register-device", ({ deviceId }) => {
      socket.deviceId = deviceId;
    });

    // TYPING INDICATOR
    socket.on("typing:start", ({ chatId }) => {
      console.log(
        `✍️ typing:start from user ${socket.userId} in chat ${chatId}`,
      );
      console.log(`📡 Broadcasting to room: chat-${chatId}`);
      console.log(
        `👥 Sockets in room:`,
        io.sockets.adapter.rooms.get(`chat-${chatId}`)?.size || 0,
      );
      if (!socket.userId) return;

      const chatIdNum = Number(chatId); // ✅ Ensure it's a number

      socket.to(`chat-${chatIdNum}`).emit("typing:start", {
        chatId: chatIdNum, // ✅ Send as number
        userId: socket.userId,
      });
    });

    socket.on("typing:stop", ({ chatId }) => {
      console.log(`typing:stop from user ${socket.userId} in chat ${chatId}`);
      if (!socket.userId) return;

      const chatIdNum = Number(chatId); // ✅ Ensure it's a number

      socket.to(`chat-${chatIdNum}`).emit("typing:stop", {
        chatId: chatIdNum, // ✅ Send as number
        userId: socket.userId,
      });
    });

    // Calling start
    socket.on("call:start", async ({ receiverId, type }) => {
      if (!["audio", "video"].includes(type)) {
        socket.emit("call:unavailable", { reason: "INVALID_TYPE" });
        return;
      }

      const callerId = socket.userId;
      if (callerId === receiverId) return;

      const receiverSocketId = getUserSocketId(receiverId);

      if (!receiverSocketId) {
        await sendPushToUser(receiverId, {
          title: "Incoming Call",
          body: "Someone is calling you",
          data: {
            type,
            callerId: String(callerId),
          },
        });

        socket.emit("call:unavailable", {
          reason: "USER_OFFLINE",
        });
        return;
      }

      const call = await Call.create({
        callerId,
        receiverId,
        type,
        status: "ringing",
      });

      activeCalls.set(call.id, { callerId, receiverId });

      // ring receiver
      io.to(receiverSocketId).emit("call:incoming", {
        callId: call.id,
        callerId,
        type,
      });

      // missed call timeout(30sec)
      setTimeout(async () => {
        const callInfo = activeCalls.get(call.id);
        if (!callInfo) return;

        const latestCall = await Call.findByPk(call.id);

        if (!latestCall) return;
        if (latestCall.status === "ringing") {
          await latestCall.update({
            status: "missed",
            endedAt: new Date(),
          });

          // notify caller
          const callerSocketId = getUserSocketId(callInfo.callerId);
          if (callerSocketId) {
            io.to(callerSocketId).emit("call:missed", {
              callId: call.id,
            });
          }

          await sendPushToUser(receiverId, {
            title: "Missed Call",
            body: "You missed a call",
            data: {
              callId: String(call.id),
              type: "missed_call",
            },
          });

          activeCalls.delete(call.id);
        }
      }, 30000);
    });

    // calls accept
    socket.on("call:accept", async ({ callId }) => {
      const callInfo = activeCalls.get(callId);

      if (!callInfo) return;

      await Call.update(
        {
          status: "ongoing",
          startedAt: new Date(),
        },
        {
          where: {
            id: callId,
          },
        },
      );

      // notify caller
      const callerSocketId = getUserSocketId(callInfo.callerId);

      if (callerSocketId) {
        io.to(callerSocketId).emit("call:accepted", {
          callId,
        });
      }

      activeCalls.set(callId, callInfo);
    });

    // Calls rejects
    socket.on("call:reject", async ({ callId }) => {
      const callInfo = activeCalls.get(callId);
      if (!callInfo) return;

      await Call.update(
        {
          status: "rejected",
          endedAt: new Date(),
        },
        {
          where: {
            id: callId,
          },
        },
      );

      // notify caller
      const callerSocketId = getUserSocketId(callInfo.callerId);

      if (callerSocketId) {
        io.to(callerSocketId).emit("call:rejected", {
          callId,
        });
      }

      // cleanup
      activeCalls.delete(callId);
    });

    // call end
    socket.on("call:end", async ({ callId }) => {
      const callInfo = activeCalls.get(callId);
      if (!callInfo) return;

      // update DB
      await Call.update(
        {
          status: "ended",
          endedAt: new Date(),
        },
        {
          where: {
            id: callId,
          },
        },
      );

      // notify the other user

      const otherUserId =
        socket.userId === callInfo.callerId
          ? callInfo.receiverId
          : callInfo.callerId;

      const otherSocketId = getUserSocketId(otherUserId);

      if (otherSocketId) {
        io.to(otherSocketId).emit("call:ended", {
          callId,
        });
      }

      // cleanup
      activeCalls.delete(callId);
    });

    // Mute mic for calls
    socket.on("call:mute", async ({ callId }) => {
      const callInfo = activeCalls.get(callId);
      if (!callInfo) return;
      const otherUserId =
        socket.userId === callInfo.callerId
          ? callInfo.receiverId
          : callInfo.callerId;

      const otherSocketId = getUserSocketId(otherUserId);

      if (otherSocketId) {
        io.to(otherSocketId).emit("call:user-muted", {
          userId: socket.userId,
          callId,
        });
      }
    });

    // unmute mic for calls
    socket.on("call:unmute", async ({ callId }) => {
      const callInfo = activeCalls.get(callId);
      if (!callInfo) return;
      const otherUserId =
        socket.userId === callInfo.callerId
          ? callInfo.receiverId
          : callInfo.callerId;

      const otherSocketId = getUserSocketId(otherUserId);

      if (otherSocketId) {
        io.to(otherSocketId).emit("call:user-unmuted", {
          userId: socket.userId,
          callId,
        });
      }
    });

    // camera OFF for calls
    socket.on("call:camera-off", async ({ callId }) => {
      const callInfo = activeCalls.get(callId);
      if (!callInfo) return;
      const otherUserId =
        socket.userId === callInfo.callerId
          ? callInfo.receiverId
          : callInfo.callerId;

      const otherSocketId = getUserSocketId(otherUserId);

      if (otherSocketId) {
        io.to(otherSocketId).emit("call:user-camera-off", {
          userId: socket.userId,
          callId,
        });
      }
    });

    // camera ON for calls
    socket.on("call:camera-on", async ({ callId }) => {
      const callInfo = activeCalls.get(callId);
      if (!callInfo) return;
      const otherUserId =
        socket.userId === callInfo.callerId
          ? callInfo.receiverId
          : callInfo.callerId;

      const otherSocketId = getUserSocketId(otherUserId);

      if (otherSocketId) {
        io.to(otherSocketId).emit("call:user-camera-on", {
          userId: socket.userId,
          callId,
        });
      }
    });

    // DISCONNECT (FIXED)
    socket.on("disconnect", async () => {
      console.log("User Disconnected:", socket.id);
      console.log("socket disconnected", socket.userId);

      for (const [callId, callInfo] of Array.from(activeCalls.entries())) {
        if (
          callInfo.callerId === socket.userId ||
          callInfo.receiverId === socket.userId
        ) {
          await Call.update(
            {
              status: "ended",
              endedAt: new Date(),
            },
            {
              where: {
                id: callId,
              },
            },
          );

          const otherUserId =
            socket.userId === callInfo.callerId
              ? callInfo.receiverId
              : callInfo.callerId;

          const otherSocketId = getUserSocketId(otherUserId);
          if (otherSocketId) {
            io.to(otherSocketId).emit("call:ended", {
              callId,
            });
          }

          activeCalls.delete(callId);
        }
      }

      const current = (onlineUsers.get(socket.userId) || 1) - 1;

      if (current <= 0) {
        onlineUsers.delete(socket.userId);

        await Users.update(
          {
            isOnline: false,
            lastSeen: new Date(),
          },
          { where: { id: socket.userId } },
        );

        // update device last seen (if exists)
        if (socket.deviceId) {
          await Devices.update(
            { lastSeen: new Date() },
            { where: { id: socket.deviceId } },
          );
        }

        socket.broadcast.emit("user-offline", socket.userId);
      } else {
        onlineUsers.set(socket.userId, current);
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
