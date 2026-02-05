const { Server } = require("socket.io");
const { Devices, Users, MessageStatus, Messages, Call } = require("../models");
const { sendPushToUser } = require("../services/push.service");

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

  io.on("connection", async (socket) => {
    console.log("🔥 SOCKET CONNECTED:", socket.id);
    console.log("🔥 AUTH DATA:", socket.handshake.auth);
    socket.onAny((event, data) => {
      console.log("SOCKET EVENT:", event, data);
    });
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
      console.log("👤 join-user received:", userId);
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
              callId: String(call.Id),
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
