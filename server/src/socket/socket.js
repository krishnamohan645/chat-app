// const { Server } = require("socket.io");
// const { Devices, Users, MessageStatus, Messages, Call } = require("../models");
// const { sendPushToUser } = require("../services/push.service");
// const jwt = require("jsonwebtoken");
// const { Op } = require("sequelize");
// const { redisClient } = require("../config/redis");

// let io;

// // userId -> active socket count
// const onlineUsers = new Map();

// // callId -> {callerId, receiverId}
// const activeCalls = new Map();

// const getUserSocketId = (userId) => {
//   if (!io) return null;
//   for (const [socketId, socket] of io.sockets.sockets) {
//     if (socket.userId === userId) {
//       return socketId;
//     }
//   }
//   return null;
// };

// const initSocket = (server) => {
//   io = new Server(server, {
//     cors: { origin: "*" },
//   });

//   // Add authentication middleware
//   io.use(async (socket, next) => {
//     try {
//       const token = socket.handshake.auth?.token;

//       if (!token) {
//         return next(new Error("Authentication error: No token provided"));
//       }

//       // Verify JWT token
//       const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
//       socket.userId = decoded.userId;
//       socket.user = decoded;

//       next();
//     } catch (error) {
//       console.error("Socket authentication failed:", error.message);
//       next(new Error("Authentication error: Invalid token"));
//     }
//   });

//   io.on("connection", async (socket) => {
//     console.log("✅ SOCKET CONNECTED");
//     console.log("socket.id:", socket.id);
//     console.log("socket.userId:", socket.userId);

//     socket.onAny((event, data) => {
//       console.log("SOCKET EVENT:", event, data);
//     });
//     await redisClient.set(`online:${socket.userId}`, "1");
//     console.log("User set online in Redis:", socket.userId);

//     socket.join(`user-${socket.userId}`);
//     console.log(`👤 User ${socket.userId} joined their user room`);

//     // CHAT ROOMS - JOIN CHAT
//     socket.on("join-chat", async (chatId) => {
//       console.log(`📥 User ${socket.userId} joining chat ${chatId}`);
//       console.log(
//         "👥 Room members:",
//         io.sockets.adapter.rooms.get(`chat-${chatId}`),
//       );

//       socket.join(`chat-${chatId}`);

//       // ✅ Step 1: Mark as delivered
//       await MessageStatus.update(
//         { status: "delivered" },
//         {
//           where: {
//             userId: socket.userId,
//             status: "sent",
//           },
//           include: [
//             {
//               model: Messages,
//               where: {
//                 chatId,
//               },
//             },
//           ],
//         },
//       );

//       // ✅ Step 2: Mark as read
//       await MessageStatus.update(
//         { status: "read" },
//         {
//           where: {
//             userId: socket.userId,
//             status: { [Op.ne]: "read" },
//           },
//           include: [
//             {
//               model: Messages,
//               required: true,
//               where: { chatId },
//             },
//           ],
//         },
//       );

//       // ✅ Step 3: Notify other users in chat
//       socket.to(`chat-${chatId}`).emit("message-delivered", {
//         chatId,
//         userId: socket.userId,
//       });

//       socket.to(`chat-${chatId}`).emit("messages-read", {
//         chatId: chatId,
//         readerId: socket.userId,
//       });

//       console.log(`✅ Messages marked as read for chat ${chatId}`);
//     });

//     // MESSAGE READ (SEPARATE EVENT)
//     socket.on("messages-read", async ({ chatId }) => {
//       try {
//         await MessageStatus.update(
//           { status: "read" },
//           {
//             where: {
//               userId: socket.userId,
//               status: { [Op.ne]: "read" },
//             },
//             include: [
//               {
//                 model: Messages,
//                 required: true,
//                 where: { chatId },
//               },
//             ],
//           },
//         );

//         // 🔔 NOTIFY SENDER(S) that messages were read
//         socket.to(`chat-${chatId}`).emit("messages-read", {
//           chatId: chatId,
//           readerId: socket.userId,
//         });
//       } catch (error) {
//         console.error("Error marking messages as read:", error);
//       }
//     });

//     // ============================================
//     // LEAVE CHAT
//     // ============================================
//     socket.on("leave-chat", (chatId) => {
//       socket.leave(`chat-${chatId}`);
//       console.log(`📤 User ${socket.userId} left chat ${chatId}`);
//     });

//     // USER ROOM (notifications)
//     socket.on("join-user", () => {
//       socket.join(`user-${socket.userId}`);
//     });

//     // ONLINE LOGIC (FIXED)
//     const count = (onlineUsers.get(socket.userId) || 0) + 1;
//     onlineUsers.set(socket.userId, count);
//     await redisClient.set(`online:${socket.userId}`, "1");

//     if (count === 1) {
//       await Users.update({ isOnline: true }, { where: { id: socket.userId } });

//       await MessageStatus.update(
//         { status: "delivered" },
//         {
//           where: {
//             userId: socket.userId,
//             status: "sent",
//           },
//         },
//       );

//       socket.broadcast.emit("user-online", socket.userId);
//     }

//     // OPTIONAL DEVICE TRACKING
//     socket.on("register-device", ({ deviceId }) => {
//       socket.deviceId = deviceId;
//     });

//     // TYPING INDICATOR
//     socket.on("typing:start", ({ chatId }) => {
//       if (!socket.userId) return;

//       const chatIdNum = Number(chatId); // ✅ Ensure it's a number

//       socket.to(`chat-${chatIdNum}`).emit("typing:start", {
//         chatId: chatIdNum, // ✅ Send as number
//         userId: socket.userId,
//       });
//     });

//     socket.on("typing:stop", ({ chatId }) => {
//       console.log(`typing:stop from user ${socket.userId} in chat ${chatId}`);
//       if (!socket.userId) return;

//       const chatIdNum = Number(chatId); // ✅ Ensure it's a number

//       socket.to(`chat-${chatIdNum}`).emit("typing:stop", {
//         chatId: chatIdNum, // ✅ Send as number
//         userId: socket.userId,
//       });
//     });

//     // Calling start
//     socket.on("call:start", async ({ receiverId, type }) => {
//       if (!["audio", "video"].includes(type)) {
//         socket.emit("call:unavailable", { reason: "INVALID_TYPE" });
//         return;
//       }

//       const callerId = socket.userId;
//       if (callerId === receiverId) return;

//       const receiverSocketId = getUserSocketId(receiverId);

//       if (!receiverSocketId) {
//         await sendPushToUser(receiverId, {
//           title: "Incoming Call",
//           body: "Someone is calling you",
//           data: {
//             type,
//             callerId: String(callerId),
//           },
//         });

//         socket.emit("call:unavailable", {
//           reason: "USER_OFFLINE",
//         });
//         return;
//       }

//       const call = await Call.create({
//         callerId,
//         receiverId,
//         type,
//         status: "ringing",
//       });

//       activeCalls.set(call.id, { callerId, receiverId });

//       // Ring receiver
//       io.to(receiverSocketId).emit("call:incoming", {
//         callId: call.id,
//         callerId,
//         type,
//       });

//       // ✅ Tell caller the call was created
//       socket.emit("call:started", {
//         callId: call.id,
//         receiverId,
//         type,
//       });

//       // missed call timeout(30sec)
//       setTimeout(async () => {
//         const callInfo = activeCalls.get(call.id);
//         if (!callInfo) return;

//         const latestCall = await Call.findByPk(call.id);

//         if (!latestCall) return;
//         if (latestCall.status === "ringing") {
//           await latestCall.update({
//             status: "missed",
//             endedAt: new Date(),
//           });

//           // notify caller
//           const callerSocketId = getUserSocketId(callInfo.callerId);
//           if (callerSocketId) {
//             io.to(callerSocketId).emit("call:missed", {
//               callId: call.id,
//             });
//           }

//           await sendPushToUser(receiverId, {
//             title: "Missed Call",
//             body: "You missed a call",
//             data: {
//               callId: String(call.id),
//               type: "missed_call",
//             },
//           });

//           activeCalls.delete(call.id);
//         }
//       }, 30000);
//     });

//     // calls accept
//     socket.on("call:accept", async ({ callId }) => {
//       // ✅ ENSURE callId is a NUMBER
//       const callIdNum = Number(callId);

//       let callInfo = activeCalls.get(callIdNum); // ✅ Use NUMBER

//       if (!callInfo) {
//         return;
//       }

//       await Call.update(
//         {
//           status: "ongoing",
//           startedAt: new Date(),
//         },
//         {
//           where: {
//             id: callIdNum, // ✅ Use NUMBER
//           },
//         },
//       );

//       // ✅ Mark call as accepted
//       callInfo.status = "accepted";
//       activeCalls.set(callIdNum, callInfo); // ✅ Use NUMBER

//       // Notify caller
//       const callerSocketId = getUserSocketId(callInfo.callerId);

//       if (callerSocketId) {
//         io.to(callerSocketId).emit("call:accepted", {
//           callId: callIdNum, // ✅ Send as NUMBER
//         });
//       }
//       if (callInfo.pendingOffer) {
//         // Send directly to THIS socket (the one who just accepted)
//         setTimeout(() => {
//           socket.emit("webrtc:offer", {
//             callId: callIdNum, // ✅ Send as NUMBER
//             signal: callInfo.pendingOffer,
//           });

//           console.log("✅ webrtc:offer emitted to receiver!");
//         }, 1000);
//       } else {
//         console.log("Call info:", JSON.stringify(callInfo, null, 2));
//       }
//     });

//     // Calls rejects
//     socket.on("call:reject", async ({ callId }) => {
//       const callInfo = activeCalls.get(callId);
//       if (!callInfo) return;

//       await Call.update(
//         {
//           status: "rejected",
//           endedAt: new Date(),
//         },
//         {
//           where: {
//             id: callId,
//           },
//         },
//       );

//       // notify caller
//       const callerSocketId = getUserSocketId(callInfo.callerId);

//       if (callerSocketId) {
//         io.to(callerSocketId).emit("call:rejected", {
//           callId,
//         });
//       }

//       // cleanup
//       activeCalls.delete(callId);
//     });

//     // call end
//     socket.on("call:end", async ({ callId }) => {
//       const callIdNum = Number(callId);

//       const callInfo = activeCalls.get(callIdNum);

//       if (!callInfo) {
//         return;
//       }
//       // update DB
//       await Call.update(
//         {
//           status: "ended",
//           endedAt: new Date(),
//         },
//         {
//           where: {
//             id: callIdNum,
//           },
//         },
//       );

//       // notify the other user
//       const otherUserId =
//         socket.userId === callInfo.callerId
//           ? callInfo.receiverId
//           : callInfo.callerId;

//       const otherSocketId = getUserSocketId(otherUserId);

//       if (otherSocketId) {
//         io.to(otherSocketId).emit("call:ended", {
//           callId: callIdNum,
//         });
//       } else {
//         console.log("⚠️ Other user not connected, can't notify");
//       }

//       // cleanup
//       activeCalls.delete(callIdNum);
//     });

//     // Mute mic for calls
//     socket.on("call:mute", async ({ callId }) => {
//       const callInfo = activeCalls.get(callId);
//       if (!callInfo) return;
//       const otherUserId =
//         socket.userId === callInfo.callerId
//           ? callInfo.receiverId
//           : callInfo.callerId;

//       const otherSocketId = getUserSocketId(otherUserId);

//       if (otherSocketId) {
//         io.to(otherSocketId).emit("call:user-muted", {
//           userId: socket.userId,
//           callId,
//         });
//       }
//     });

//     // unmute mic for calls
//     socket.on("call:unmute", async ({ callId }) => {
//       const callInfo = activeCalls.get(callId);
//       if (!callInfo) return;
//       const otherUserId =
//         socket.userId === callInfo.callerId
//           ? callInfo.receiverId
//           : callInfo.callerId;

//       const otherSocketId = getUserSocketId(otherUserId);

//       if (otherSocketId) {
//         io.to(otherSocketId).emit("call:user-unmuted", {
//           userId: socket.userId,
//           callId,
//         });
//       }
//     });

//     // camera OFF for calls
//     socket.on("call:camera-off", async ({ callId }) => {
//       const callInfo = activeCalls.get(callId);
//       if (!callInfo) return;
//       const otherUserId =
//         socket.userId === callInfo.callerId
//           ? callInfo.receiverId
//           : callInfo.callerId;

//       const otherSocketId = getUserSocketId(otherUserId);

//       if (otherSocketId) {
//         io.to(otherSocketId).emit("call:user-camera-off", {
//           userId: socket.userId,
//           callId,
//         });
//       }
//     });

//     // camera ON for calls
//     socket.on("call:camera-on", async ({ callId }) => {
//       const callInfo = activeCalls.get(callId);
//       if (!callInfo) return;
//       const otherUserId =
//         socket.userId === callInfo.callerId
//           ? callInfo.receiverId
//           : callInfo.callerId;

//       const otherSocketId = getUserSocketId(otherUserId);

//       if (otherSocketId) {
//         io.to(otherSocketId).emit("call:user-camera-on", {
//           userId: socket.userId,
//           callId,
//         });
//       }
//     }); // ✅ CLOSE camera-on handler HERE

//     // ✅ WEBRTC OFFER - Now at correct level
//     socket.on("webrtc:offer", ({ callId, receiverId, signal }) => {
//       // ✅ ENSURE callId is a NUMBER
//       const callIdNum = Number(callId);

//       // ✅ Use NUMBER version
//       let callInfo = activeCalls.get(callIdNum);

//       if (!callInfo) {
//         callInfo = {
//           callerId: socket.userId,
//           receiverId: receiverId,
//         };
//       }

//       // ✅ Store the offer
//       callInfo.pendingOffer = signal;
//       activeCalls.set(callIdNum, callInfo); // ✅ Use NUMBER

//       // ✅ Check if call is already accepted
//       if (callInfo.status === "accepted") {
//         const receiverSocketId = getUserSocketId(receiverId);
//         if (receiverSocketId) {
//           io.to(receiverSocketId).emit("webrtc:offer", {
//             callId: callIdNum, // ✅ Send as NUMBER
//             signal,
//           });
//         }
//       } else {
//         console.log("⏳ Call not yet accepted, offer stored for later");
//       }
//     });

//     // ✅ WEBRTC ANSWER - Now at correct level
//     socket.on("webrtc:answer", ({ callId, signal }) => {
//       const callIdNum = Number(callId); // ✅ Convert to number
//       const callInfo = activeCalls.get(callIdNum);

//       if (!callInfo) {
//         console.error("❌ No call info for answer");
//         return;
//       }

//       const callerSocketId = getUserSocketId(callInfo.callerId);

//       if (callerSocketId) {
//         io.to(callerSocketId).emit("webrtc:answer", {
//           callId: callIdNum,
//           signal,
//         });
//       }
//     });

//     // DISCONNECT (FIXED)
//     socket.on("disconnect", async () => {
//       for (const [callId, callInfo] of Array.from(activeCalls.entries())) {
//         if (
//           callInfo.callerId === socket.userId ||
//           callInfo.receiverId === socket.userId
//         ) {
//           await Call.update(
//             {
//               status: "ended",
//               endedAt: new Date(),
//             },
//             {
//               where: {
//                 id: callId,
//               },
//             },
//           );

//           const otherUserId =
//             socket.userId === callInfo.callerId
//               ? callInfo.receiverId
//               : callInfo.callerId;

//           const otherSocketId = getUserSocketId(otherUserId);
//           if (otherSocketId) {
//             io.to(otherSocketId).emit("call:ended", {
//               callId,
//             });
//           }

//           activeCalls.delete(callId);
//         }
//       }

//       const current = (onlineUsers.get(socket.userId) || 1) - 1;

//       if (current <= 0) {
//         onlineUsers.delete(socket.userId);
//         await redisClient.del(`online:${socket.userId}`);
//         console.log("User removed from Redis:", socket.userId);
//         await Users.update(
//           {
//             isOnline: false,
//             lastSeen: new Date(),
//           },
//           { where: { id: socket.userId } },
//         );

//         // update device last seen (if exists)
//         if (socket.deviceId) {
//           await Devices.update(
//             { lastSeen: new Date() },
//             { where: { id: socket.deviceId } },
//           );
//         }

//         socket.broadcast.emit("user-offline", socket.userId);
//       } else {
//         onlineUsers.set(socket.userId, current);
//       }
//     });
//   });
// };

// const isUserOnline = (userId) => {
//   return onlineUsers.has(userId);
// };

// const getIO = () => {
//   if (!io) {
//     throw new Error("Socket.io not initialized");
//   }
//   return io;
// };

// module.exports = {
//   initSocket,
//   getIO,
//   isUserOnline,
// };

const { Server } = require("socket.io");
const {
  Devices,
  Users,
  MessageStatus,
  Messages,
  Call,
  Notification,
} = require("../models");
const { sendPushToUser } = require("../services/push.service");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { redisClient } = require("../config/redis");

let io;

// ============================================================
// 🔑 REDIS KEY HELPERS
// Think of Redis like a giant key-value dictionary in the cloud.
// We use prefixes to organize keys by what they store.
// ============================================================

const REDIS_KEYS = {
  // "online:42"        → "1"           (is user 42 online?)
  userOnline: (userId) => `online:${userId}`,

  // "socket:42"        → "abc123"      (socket ID of user 42)
  userSocket: (userId) => `socket:${userId}`,

  // "socket_user:abc123" → "42"        (which user owns socket abc123)
  socketUser: (socketId) => `socket_user:${socketId}`,

  // "online_count:42"  → "2"           (how many tabs/devices are open)
  onlineCount: (userId) => `online_count:${userId}`,

  // "call:99"          → JSON string   (all info about call ID 99)
  call: (callId) => `call:${callId}`,
};

// ============================================================
// 📡 ONLINE USER HELPERS (replaces in-memory onlineUsers Map)
// ============================================================

/**
 * Increments the connection count for a user.
 * Returns the NEW count (useful to know if this is the FIRST connection).
 * INCR is atomic — safe even if two tabs connect at the same millisecond.
 */
const incrementOnlineCount = async (userId) => {
  return await redisClient.incr(REDIS_KEYS.onlineCount(userId));
  // e.g. user opens 1st tab → returns 1
  //      user opens 2nd tab → returns 2
};

/**
 * Decrements the connection count.
 * Returns the NEW count (if 0 or below, user is fully offline).
 */
const decrementOnlineCount = async (userId) => {
  const count = await redisClient.decr(REDIS_KEYS.onlineCount(userId));
  if (count <= 0) {
    // Clean up the key entirely so it doesn't linger
    await redisClient.del(REDIS_KEYS.onlineCount(userId));
    return 0;
  }
  return count;
};

/**
 * Checks if a user is online.
 * We check the `online:userId` key — it exists only while user is online.
 */
const isUserOnlineRedis = async (userId) => {
  const result = await redisClient.exists(REDIS_KEYS.userOnline(userId));
  return result === 1;
};

// ============================================================
// 🔗 SOCKET ↔ USER MAPPING HELPERS
// We need to find a user's socketId quickly without looping
// through all connected sockets (which breaks in multi-server setups).
// ============================================================

/**
 * When a user connects, store their socketId in Redis.
 * We store TWO keys so we can look up in both directions:
 *   socket:userId   → socketId   (find socket FROM user)
 *   socket_user:socketId → userId   (find user FROM socket)
 *
 * TTL = 24 hours (auto-cleanup if disconnect event is missed)
 */
const registerSocketMapping = async (userId, socketId) => {
  await redisClient.set(REDIS_KEYS.userSocket(userId), socketId, { EX: 86400 });
  await redisClient.set(REDIS_KEYS.socketUser(socketId), String(userId), {
    EX: 86400,
  });
};

/**
 * When a user disconnects, remove both mapping keys.
 */
const removeSocketMapping = async (userId, socketId) => {
  await redisClient.del(REDIS_KEYS.userSocket(userId));
  await redisClient.del(REDIS_KEYS.socketUser(socketId));
};

/**
 * Get a user's current socketId from Redis.
 * Returns null if the user is not connected.
 */
const getUserSocketId = async (userId) => {
  return await redisClient.get(REDIS_KEYS.userSocket(userId));
  // e.g. returns "abc123xyz" or null
};

// ============================================================
// 📞 ACTIVE CALLS HELPERS (replaces in-memory activeCalls Map)
// Storing calls in Redis means they survive server restarts
// and work across multiple server instances.
// ============================================================

/**
 * Save call info to Redis as JSON.
 * TTL = 1 hour (auto-cleanup if call hangs and end event is never fired).
 */
const saveCall = async (callId, callInfo) => {
  await redisClient.set(
    REDIS_KEYS.call(callId),
    JSON.stringify(callInfo),
    { EX: 3600 }, // expires in 1 hour automatically
  );
};

/**
 * Get call info from Redis. Returns parsed object or null.
 */
const getCall = async (callId) => {
  const data = await redisClient.get(REDIS_KEYS.call(callId));
  if (!data) return null;
  return JSON.parse(data); // turn the JSON string back into an object
};

/**
 * Update specific fields in a call (merge, don't replace).
 */
const updateCall = async (callId, updates) => {
  const existing = await getCall(callId);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  await saveCall(callId, updated);
  return updated;
};

/**
 * Delete a call from Redis when it's over.
 */
const deleteCall = async (callId) => {
  await redisClient.del(REDIS_KEYS.call(callId));
};

// ============================================================
// 🚀 MAIN SOCKET INITIALIZATION
// ============================================================

const initSocket = (server) => {
  // io = new Server(server, {
  //   cors: { origin: "*" },
  // });

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (
          origin === process.env.FRONTEND_URL ||
          origin.endsWith(".vercel.app")
        ) {
          return callback(null, true);
        }

        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    },
  });
  // ── JWT Authentication Middleware ──────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token)
        return next(new Error("Authentication error: No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.userId;
      socket.user = decoded;
      next();
    } catch (error) {
      console.error("Socket authentication failed:", error.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // ── On Connection ──────────────────────────────────────────
  io.on("connection", async (socket) => {
    console.log(
      `✅ Socket connected | socketId: ${socket.id} | userId: ${socket.userId}`,
    );

    socket.onAny((event, data) => {
      console.log(`📨 EVENT [${event}]`, data);
    });

    // ── Step 1: Register socket ↔ user mapping in Redis ──────
    await registerSocketMapping(socket.userId, socket.id);

    // ── Step 2: Join personal room ────────────────────────────
    socket.join(`user-${socket.userId}`);

    // ── Step 3: Handle online count ───────────────────────────
    // INCR returns the new count. If it's 1, this is the FIRST device/tab.
    const onlineCount = await incrementOnlineCount(socket.userId);

    if (onlineCount === 1) {
      // First connection — mark user as fully online
      await redisClient.set(REDIS_KEYS.userOnline(socket.userId), "1");
      await Users.update({ isOnline: true }, { where: { id: socket.userId } });

      // Mark any "sent" messages as "delivered" now that user is online
      await MessageStatus.update(
        { status: "delivered" },
        { where: { userId: socket.userId, status: "sent" } },
      );

      // Tell everyone else this user came online
      socket.broadcast.emit("user-online", socket.userId);
      console.log(`🟢 User ${socket.userId} is now online`);
    }

    // ── OPTIONAL DEVICE TRACKING ──────────────────────────────
    socket.on("register-device", ({ deviceId }) => {
      socket.deviceId = deviceId;
    });

    // ── JOIN CHAT ─────────────────────────────────────────────
    socket.on("join-chat", async (chatId) => {
      console.log(`📥 User ${socket.userId} joining chat ${chatId}`);
      socket.join(`chat-${chatId}`);

      // Mark messages as delivered
      await MessageStatus.update(
        { status: "delivered" },
        {
          where: { userId: socket.userId, status: "sent" },
          include: [{ model: Messages, where: { chatId } }],
        },
      );

      // Mark messages as read
      await MessageStatus.update(
        { status: "read" },
        {
          where: { userId: socket.userId, status: { [Op.ne]: "read" } },
          include: [{ model: Messages, required: true, where: { chatId } }],
        },
      );

      // ✅ ALSO mark related notifications as read
      await Notification.update(
        { isRead: true },
        {
          where: {
            userId: socket.userId,
            chatId,
            type: "MESSAGE", // optional but recommended
            isRead: false,
          },
        },
      );

      // 🔔 Tell frontend to refresh notifications
      io.to(`user-${socket.userId}`).emit("notifications:updated", {
        chatId,
      });

      // Notify others in the chat
      socket
        .to(`chat-${chatId}`)
        .emit("message-delivered", { chatId, userId: socket.userId });
      socket
        .to(`chat-${chatId}`)
        .emit("messages-read", { chatId, readerId: socket.userId });
      console.log(`✅ Messages marked as read for chat ${chatId}`);
    });

    // ── MESSAGES READ ─────────────────────────────────────────
    socket.on("messages-read", async ({ chatId }) => {
      try {
        await MessageStatus.update(
          { status: "read" },
          {
            where: { userId: socket.userId, status: { [Op.ne]: "read" } },
            include: [{ model: Messages, required: true, where: { chatId } }],
          },
        );
        await Notification.update(
          { isRead: true },
          {
            where: {
              userId: socket.userId,
              chatId,
              isRead: false,
            },
          },
        );

        console.log("🔔 Emitting notifications:updated for", socket.userId);
        io.to(`user-${socket.userId}`).emit("notifications:updated");
        socket
          .to(`chat-${chatId}`)
          .emit("messages-read", { chatId, readerId: socket.userId });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // ── LEAVE CHAT ────────────────────────────────────────────
    socket.on("leave-chat", (chatId) => {
      socket.leave(`chat-${chatId}`);
      console.log(`📤 User ${socket.userId} left chat ${chatId}`);
    });

    // ── TYPING INDICATORS ─────────────────────────────────────
    socket.on("typing:start", ({ chatId }) => {
      if (!socket.userId) return;
      const chatIdNum = Number(chatId);
      socket
        .to(`chat-${chatIdNum}`)
        .emit("typing:start", { chatId: chatIdNum, userId: socket.userId });
    });

    socket.on("typing:stop", ({ chatId }) => {
      if (!socket.userId) return;
      const chatIdNum = Number(chatId);
      socket
        .to(`chat-${chatIdNum}`)
        .emit("typing:stop", { chatId: chatIdNum, userId: socket.userId });
    });

    // ── CALL: START ───────────────────────────────────────────
    socket.on("call:start", async ({ receiverId, type }) => {
      if (!["audio", "video"].includes(type)) {
        socket.emit("call:unavailable", { reason: "INVALID_TYPE" });
        return;
      }

      const callerId = socket.userId;
      if (callerId === receiverId) return;

      // Look up receiver's socket ID from Redis instead of looping sockets
      const receiverSocketId = await getUserSocketId(receiverId);

      if (!receiverSocketId) {
        // User is offline — send a push notification instead
        await sendPushToUser(receiverId, {
          title: "Incoming Call",
          body: "Someone is calling you",
          data: { type, callerId: String(callerId) },
        });
        socket.emit("call:unavailable", { reason: "USER_OFFLINE" });
        return;
      }

      // Create call record in DB
      const call = await Call.create({
        callerId,
        receiverId,
        type,
        status: "ringing",
      });

      // Save call info to Redis (replaces activeCalls Map)
      await saveCall(call.id, {
        callerId,
        receiverId,
        type,
        status: "ringing",
        pendingOffer: null,
      });

      // Ring receiver
      io.to(receiverSocketId).emit("call:incoming", {
        callId: call.id,
        callerId,
        type,
      });

      // Tell caller the call was created
      socket.emit("call:started", { callId: call.id, receiverId, type });

      // ⏰ Missed call timeout (30 seconds)
      setTimeout(async () => {
        const callInfo = await getCall(call.id);
        if (!callInfo) return; // already ended

        const latestCall = await Call.findByPk(call.id);
        if (!latestCall || latestCall.status !== "ringing") return;

        // Mark as missed in DB
        await latestCall.update({ status: "missed", endedAt: new Date() });
        await deleteCall(call.id); // cleanup Redis

        // Notify caller
        const callerSocketId = await getUserSocketId(callInfo.callerId);
        if (callerSocketId) {
          io.to(callerSocketId).emit("call:missed", { callId: call.id });
        }

        // Push notification to receiver
        await sendPushToUser(receiverId, {
          title: "Missed Call",
          body: "You missed a call",
          data: { callId: String(call.id), type: "missed_call" },
        });
      }, 30000);
    });

    // ── CALL: ACCEPT ──────────────────────────────────────────
    socket.on("call:accept", async ({ callId }) => {
      const callIdNum = Number(callId);
      const callInfo = await getCall(callIdNum);

      if (!callInfo) return;

      // Update DB
      await Call.update(
        { status: "ongoing", startedAt: new Date() },
        { where: { id: callIdNum } },
      );

      // Update Redis call status
      const updated = await updateCall(callIdNum, { status: "accepted" });

      // Notify caller
      const callerSocketId = await getUserSocketId(callInfo.callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call:accepted", { callId: callIdNum });
      }

      // If caller already sent WebRTC offer, forward it now
      if (updated?.pendingOffer) {
        setTimeout(() => {
          socket.emit("webrtc:offer", {
            callId: callIdNum,
            signal: updated.pendingOffer,
          });
          console.log("✅ Forwarded pending webrtc:offer to receiver");
        }, 1000);
      }
    });

    // ── CALL: REJECT ──────────────────────────────────────────
    socket.on("call:reject", async ({ callId }) => {
      const callInfo = await getCall(callId);
      if (!callInfo) return;

      await Call.update(
        { status: "rejected", endedAt: new Date() },
        { where: { id: callId } },
      );

      const callerSocketId = await getUserSocketId(callInfo.callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call:rejected", { callId });
      }

      await deleteCall(callId);
    });

    // ── CALL: END ─────────────────────────────────────────────
    socket.on("call:end", async ({ callId }) => {
      const callIdNum = Number(callId);
      const callInfo = await getCall(callIdNum);
      if (!callInfo) return;

      await Call.update(
        { status: "ended", endedAt: new Date() },
        { where: { id: callIdNum } },
      );

      // Notify the other participant
      const otherUserId =
        socket.userId === callInfo.callerId
          ? callInfo.receiverId
          : callInfo.callerId;
      const otherSocketId = await getUserSocketId(otherUserId);

      if (otherSocketId) {
        io.to(otherSocketId).emit("call:ended", { callId: callIdNum });
      }

      await deleteCall(callIdNum);
    });

    // ── CALL: MUTE / UNMUTE / CAMERA ─────────────────────────
    const forwardCallEvent = async (callId, emitEvent) => {
      const callInfo = await getCall(callId);
      if (!callInfo) return;
      const otherUserId =
        socket.userId === callInfo.callerId
          ? callInfo.receiverId
          : callInfo.callerId;
      const otherSocketId = await getUserSocketId(otherUserId);
      if (otherSocketId) {
        io.to(otherSocketId).emit(emitEvent, { userId: socket.userId, callId });
      }
    };

    socket.on("call:mute", ({ callId }) =>
      forwardCallEvent(callId, "call:user-muted"),
    );
    socket.on("call:unmute", ({ callId }) =>
      forwardCallEvent(callId, "call:user-unmuted"),
    );
    socket.on("call:camera-off", ({ callId }) =>
      forwardCallEvent(callId, "call:user-camera-off"),
    );
    socket.on("call:camera-on", ({ callId }) =>
      forwardCallEvent(callId, "call:user-camera-on"),
    );

    // ── WEBRTC: OFFER ─────────────────────────────────────────
    socket.on("webrtc:offer", async ({ callId, receiverId, signal }) => {
      const callIdNum = Number(callId);

      let callInfo = await getCall(callIdNum);
      if (!callInfo) {
        // First time seeing this call — create a minimal entry
        callInfo = { callerId: socket.userId, receiverId };
      }

      // Store the offer in Redis (will be forwarded when receiver accepts)
      callInfo.pendingOffer = signal;
      await saveCall(callIdNum, callInfo);

      if (callInfo.status === "accepted") {
        // Receiver already accepted — forward offer immediately
        const receiverSocketId = await getUserSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("webrtc:offer", {
            callId: callIdNum,
            signal,
          });
        }
      } else {
        console.log(
          "⏳ Call not yet accepted, offer stored in Redis for later",
        );
      }
    });

    // ── WEBRTC: ANSWER ────────────────────────────────────────
    socket.on("webrtc:answer", async ({ callId, signal }) => {
      const callIdNum = Number(callId);
      const callInfo = await getCall(callIdNum);
      if (!callInfo) return;

      const callerSocketId = await getUserSocketId(callInfo.callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit("webrtc:answer", {
          callId: callIdNum,
          signal,
        });
      }
    });

    // ── ICE CANDIDATE (WebRTC) ────────────────────────────────
    // Optional but recommended for WebRTC to work reliably
    socket.on("webrtc:ice-candidate", async ({ callId, candidate }) => {
      const callIdNum = Number(callId);
      const callInfo = await getCall(callIdNum);
      if (!callInfo) return;

      const otherUserId =
        socket.userId === callInfo.callerId
          ? callInfo.receiverId
          : callInfo.callerId;
      const otherSocketId = await getUserSocketId(otherUserId);

      if (otherSocketId) {
        io.to(otherSocketId).emit("webrtc:ice-candidate", {
          callId: callIdNum,
          candidate,
        });
      }
    });

    // ── DISCONNECT ────────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(
        `❌ Socket disconnected | socketId: ${socket.id} | userId: ${socket.userId}`,
      );

      // ── 1. End any active calls this user was in ───────────
      // We can't easily list all calls per user without scanning Redis keys,
      // so we use a small helper: store "user_calls:userId" set of active callIds
      // (see note below — for simplicity we still handle this via DB query)
      const activeCalls = await Call.findAll({
        where: {
          status: { [Op.in]: ["ringing", "ongoing"] },
          [Op.or]: [{ callerId: socket.userId }, { receiverId: socket.userId }],
        },
      });

      for (const call of activeCalls) {
        await call.update({ status: "ended", endedAt: new Date() });

        const otherUserId =
          socket.userId === call.callerId ? call.receiverId : call.callerId;
        const otherSocketId = await getUserSocketId(otherUserId);

        if (otherSocketId) {
          io.to(otherSocketId).emit("call:ended", { callId: call.id });
        }

        await deleteCall(call.id);
      }

      // ── 2. Remove socket mapping from Redis ───────────────
      await removeSocketMapping(socket.userId, socket.id);

      // ── 3. Decrement online count ─────────────────────────
      const remaining = await decrementOnlineCount(socket.userId);

      if (remaining === 0) {
        // Last tab/device closed — mark fully offline
        await redisClient.del(REDIS_KEYS.userOnline(socket.userId));

        await Users.update(
          { isOnline: false, lastSeen: new Date() },
          { where: { id: socket.userId } },
        );

        if (socket.deviceId) {
          await Devices.update(
            { lastSeen: new Date() },
            { where: { id: socket.deviceId } },
          );
        }

        socket.broadcast.emit("user-offline", socket.userId);
        console.log(`🔴 User ${socket.userId} is now offline`);
      } else {
        console.log(
          `👥 User ${socket.userId} still has ${remaining} active connection(s)`,
        );
      }
    });
  });
};

// ============================================================
// 🔍 PUBLIC HELPERS (used by other parts of your app)
// ============================================================

/** Check if a user is online (reads from Redis) */
const isUserOnline = async (userId) => {
  return await isUserOnlineRedis(userId);
};

/** Get the Socket.io instance */
const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

/**
 * Send a socket event to a specific user from OUTSIDE the socket handler.
 * Useful in controllers/services (e.g. after sending a message via REST API).
 *
 * Example usage:
 *   const { emitToUser } = require('./socket');
 *   await emitToUser(receiverId, 'new-message', { text: 'Hello!' });
 */
const emitToUser = async (userId, event, data) => {
  if (!io) return;
  const socketId = await getUserSocketId(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
  emitToUser, // ← bonus: emit to user from controllers
  getUserSocketId, // ← bonus: get socketId from userId anywhere
};
