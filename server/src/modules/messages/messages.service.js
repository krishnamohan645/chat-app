const { Op } = require("sequelize");
const {
  Chats,
  Messages,
  MessageStatus,
  GroupMembers,
  BlockedUser,
} = require("../../models");
const { notifyOnNewMessage } = require("../../notification/notificationHook");
const { getIO, isUserOnline } = require("../../socket/socket");
const { isMember } = require("../chats/chat.service");
const { deleteFileIfExists } = require("../../utils/file.util");

const getprivateChat = async (chatId, senderId) => {
  const members = await GroupMembers.findAll({
    where: {
      chatId,
      leftAt: null,
    },
  });
  if (members.length !== 2) return null;
  return members.find((m) => m.userId !== senderId)?.userId;
};

const sendMessage = async (chatId, userId, content) => {
  console.log("🔥 sendMessage() CALLED");
  await isMember(chatId, userId);

  const receiverId = await getprivateChat(chatId, userId);

  if (receiverId) {
    const isBlocked = await BlockedUser.findOne({
      where: {
        [Op.or]: [
          { blockerId: userId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: userId },
        ],
      },
    });
    if (isBlocked) throw new Error("You cannot send message to this user");
  }
  const msg = await Messages.create({
    chatId,
    senderId: userId,
    content,
    type: "text",
  });

  console.log(msg, "msggggg");

  const members = await GroupMembers.findAll({
    where: { chatId, leftAt: null, userId: { [Op.ne]: userId } },
    // include: ["userId"],
  });

  await MessageStatus.bulkCreate(
    members.map((m) => ({
      messageId: msg.id,
      userId: m.userId,
      status: isUserOnline(m.userId) ? "delivered" : "sent",
    })),
  );

  // After bulkCreate - ADD this block (both functions)
  // members.forEach((m) => {
  //   const status = isUserOnline(m.userId) ? "delivered" : "sent";
  //   getIO()
  //     .to(`user-${m.userId}`) // Send to receiver's user room
  //     .emit("message-status:update", {
  //       chatId,
  //       messageId: msg.id,
  //       status,
  //     });
  // });

  await Chats.update(
    {
      updatedAt: new Date(),
    },
    { where: { id: chatId } },
  );

  // realtime chat message
  getIO().to(`chat-${chatId}`).emit("new-message", msg);
  console.log("🔥 emitting chat-list:update");

  // after bulkCreate in sendMessage / sendFileMessage
  const deliveredToSomeone = members.some((m) => isUserOnline(m.userId));

  if (deliveredToSomeone) {
    // tell the sender: your messages in this chat are delivered
    getIO().to(`user-${userId}`).emit("message-delivered", {
      chatId,
      messageId: msg.id,
    });
  }

  // 🔔 update chat list in realtime (USER-SPECIFIC)
  const chatMembers = await GroupMembers.findAll({
    where: {
      chatId,
      leftAt: null,
    },
  });

  chatMembers.forEach((member) => {
    getIO()
      .to(`user-${member.userId}`)
      .emit("chat-list:update", {
        chatId,
        senderId: msg.senderId,
        lastMessage: {
          text:
            msg.type === "text"
              ? msg.content
              : msg.type === "image"
                ? "📷 Photo"
                : msg.type === "file"
                  ? "📎 File"
                  : msg.content,
          createdAt: msg.createdAt,
          type: msg.type,
        },
      });
  });

  // notification hook
  await notifyOnNewMessage(chatId, userId, content);

  return msg;
};

const getMessages = async (chatId, userId, limit, offset) => {
  await isMember(chatId, userId);

  console.log(`📨 Fetching messages for chat ${chatId}, user ${userId}`);

  const deletedForMe = await MessageStatus.findAll({
    where: {
      userId,
      isDeleted: true,
    },
    attributes: ["messageId"],
    raw: true,
  });

  const deletedMessageIds = deletedForMe.map((d) => d.messageId);

  // ✅ Step 1: Fetch messages WITHOUT includes
  const messages = await Messages.findAll({
    where: {
      chatId,
      id: { [Op.notIn]: deletedMessageIds.length ? deletedMessageIds : [0] },
    },

    order: [["createdAt", "DESC"]],
    limit,
    offset,
    raw: true, // Get plain objects
  });

  console.log(`📦 Found ${messages.length} messages`);

  if (messages.length === 0) {
    return [];
  }

  // ✅ Step 2: Get all message IDs
  const messageIds = messages.map((m) => m.id);

  // ✅ Step 3: Fetch ALL MessageStatus records for these messages
  const allStatuses = await MessageStatus.findAll({
    where: {
      messageId: { [Op.in]: messageIds },
      isDeleted: false,
    },
    raw: true,
  });

  // console.log(`📊 Found ${allStatuses.length} message statuses`);
  // console.log(
  //   "Status details:",
  //   allStatuses.map(
  //     (s) => `Msg ${s.messageId}: User ${s.userId} = ${s.status}`,
  //   ),
  // );

  // ✅ Step 4: Get chat members
  const members = await GroupMembers.findAll({
    where: { chatId, leftAt: null },
    attributes: ["userId"],
    raw: true,
  });

  const receivers = members
    .filter((m) => m.userId !== userId)
    .map((m) => m.userId);

  // console.log(`👥 Receivers: ${receivers.join(", ")}`);

  // ✅ Step 5: Map messages with their status
  return messages.map((m) => {
    let status = "sent";

    // Get all statuses for this specific message
    const messageStatuses = allStatuses.filter((s) => s.messageId === m.id);

    // console.log(`\n🔍 Processing message ${m.id}:`);
    // console.log(`   Sender: ${m.senderId}, Current User: ${userId}`);
    // console.log(
    //   `   Statuses:`,
    //   messageStatuses.map((s) => `User ${s.userId}: ${s.status}`),
    // );

    if (m.senderId === userId) {
      // ✅ I SENT this message - check RECEIVER's status
      const receiverStatuses = messageStatuses.filter((s) =>
        receivers.includes(s.userId),
      );

      console.log(
        `   ✉️ I sent this. Receiver statuses:`,
        receiverStatuses.map((s) => `${s.userId}: ${s.status}`),
      );

      if (receiverStatuses.length > 0) {
        // Show the "worst" status (sent < delivered < read)
        if (receiverStatuses.some((s) => s.status === "sent")) {
          status = "sent";
        } else if (receiverStatuses.some((s) => s.status === "delivered")) {
          status = "delivered";
        } else if (receiverStatuses.every((s) => s.status === "read")) {
          status = "read";
        }
      }
    } else {
      // ✅ I RECEIVED this message - check MY status
      const myStatus = messageStatuses.find((s) => s.userId === userId);
      status = myStatus?.status || "delivered";

      // console.log(`   📥 I received this. My status: ${status}`);
    }

    // console.log(`   ✅ Final status: ${status}`);

    return {
      id: m.id,
      chatId: m.chatId,
      senderId: m.senderId,
      content: m.content,
      type: m.type,
      createdAt: m.createdAt,
      status,
      isEdited: m.isEdited,
      // ✅ Add these file fields
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      fileSize: m.fileSize,
      mimeType: m.mimeType,
    };
  });
};

const editMessage = async (messageId, userId, content) => {
  console.log(messageId, userId, content, "in editMessage");
  const msg = await Messages.findByPk(messageId);
  if (!msg || msg.senderId !== userId) {
    throw new Error("Not allowed");
  }

  await msg.update({
    content,
    isEdited: true,
  });

  getIO().to(`chat-${msg.chatId}`).emit("message-edited", {
    chatId: msg.chatId,
    messageId: msg.id,
    content,
  });

  return { message: "Message updated" };
};

const deleteMessageForEveryone = async (messageId, userId) => {
  const msg = await Messages.findByPk(messageId);
  if (!msg || msg.senderId !== userId) {
    throw new Error("Not allowed");
  }

  if (msg.fileUrl) {
    deleteFileIfExists(msg.fileUrl);
  }

  await msg.update({
    content: "This message was deleted",
    type: "system",
    fileUrl: null,
    fileName: null,
    fileSize: null,
    mimeType: null,
  });

  // SOCKET UPDATE for emit "message-deleted" (new event)
  getIO().to(`chat-${msg.chatId}`).emit("message-deleted-everyone", {
    chatId: msg.chatId,
    messageId: msg.id,
  });

  return { message: "Message deleted for everyone" };
};

const deleteMessageForMe = async (messageId, userId) => {
  const msg = await Messages.findByPk(messageId);
  if (!msg) {
    throw new Error("Message not found");
  }

  await MessageStatus.upsert({
    messageId,
    userId,
    isDeleted: true,
  });

  // ✅ No socket event needed (only affects this user)
  return { message: "Message deleted for you" };
};

const readMessage = async (messageId, userId) => {
  await MessageStatus.upsert({
    messageId,
    userId,
    status: "read",
  });
};

const readAllMessages = async (chatId, userId) => {
  await MessageStatus.update(
    { status: "read" },
    {
      where: {
        userId,
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

  getIO().to(`chat-${chatId}`).emit("messages-read", {
    chatId: chatId,
    readerId: userId,
  });
};

const sendFileMessage = async (chatId, userId, file) => {
  await isMember(chatId, userId);

  const receiverId = await getprivateChat(chatId, userId);

  if (receiverId) {
    const isBlocked = await BlockedUser.findOne({
      where: {
        [Op.or]: [
          { blockerId: userId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: userId },
        ],
      },
    });
    if (isBlocked) throw new Error("You cannot send message to this user");
  }

  // ✅ Better file type detection
  let type = "file"; // default

  if (file.mimetype.startsWith("image/")) {
    type = "image";
  } else if (file.mimetype.startsWith("video/")) {
    type = "video";
  } else if (file.mimetype.startsWith("audio/")) {
    type = "audio";
  } else if (
    file.mimetype === "application/pdf" ||
    file.mimetype.includes("document") ||
    file.mimetype.includes("word") ||
    file.mimetype.includes("sheet") ||
    file.mimetype.includes("presentation")
  ) {
    type = "document";
  }

  // ✅ Extract relative path
  let relativeFileUrl = file.path.replace(/\\/g, "/");
  const uploadsIndex = relativeFileUrl.indexOf("uploads");
  if (uploadsIndex !== -1) {
    relativeFileUrl = "/" + relativeFileUrl.substring(uploadsIndex);
  }

  console.log("📁 File type:", type);
  console.log("📁 MIME type:", file.mimetype);
  console.log("📁 File path:", file.path);
  console.log("🌐 Relative URL:", relativeFileUrl);

  const msg = await Messages.create({
    chatId,
    senderId: userId,
    type,
    content: null,
    fileUrl: relativeFileUrl,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  });

  // ... rest of your existing code
  const members = await GroupMembers.findAll({
    where: {
      chatId,
      leftAt: null,
      userId: { [Op.ne]: userId },
    },
  });

  await MessageStatus.bulkCreate(
    members.map((m) => ({
      messageId: msg.id,
      userId: m.userId,
      status: isUserOnline(m.userId) ? "delivered" : "sent",
    })),
  );

  await Chats.update({ updatedAt: new Date() }, { where: { id: chatId } });

  getIO().to(`chat-${chatId}`).emit("new-message", msg);

  const chatMembers = await GroupMembers.findAll({
    where: {
      chatId,
      leftAt: null,
    },
  });

  chatMembers.forEach((member) => {
    getIO()
      .to(`user-${member.userId}`)
      .emit("chat-list:update", {
        chatId,
        senderId: msg.senderId,
        lastMessage: {
          text:
            msg.type === "text"
              ? msg.content
              : msg.type === "image"
                ? "📷 Photo"
                : msg.type === "video"
                  ? "🎥 Video"
                  : msg.type === "audio"
                    ? "🎵 Audio"
                    : msg.type === "document"
                      ? "📄 Document"
                      : "📎 File",
          createdAt: msg.createdAt,
          type: msg.type,
        },
      });
  });

  await notifyOnNewMessage(chatId, userId, file.originalname || "media");

  return msg;
};

const searchMessages = async (chatId, userId, search) => {
  await isMember(chatId, userId);

  return Messages.findAll({
    where: {
      chatId,
      type: "text",
      content: {
        [Op.iLike]: `%${search}%`,
      },
    },
    order: [["createdAt", "DESC"]],
    limit: 50,
  });
};

const sendStickerMessage = async (chatId, userId, emoji) => {
  await isMember(chatId, userId);

  const msg = await Messages.create({
    chatId,
    senderId: userId,
    type: "sticker",
    content: emoji, // ✅ THIS WAS MISSING
  });

  getIO().to(`chat-${chatId}`).emit("new-message", msg);

  return msg;
};

module.exports = {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessageForEveryone,
  deleteMessageForMe,
  readMessage,
  sendFileMessage,
  searchMessages,
  readAllMessages,
  sendStickerMessage,
};
