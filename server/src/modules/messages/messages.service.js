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

  await Chats.update(
    {
      updatedAt: new Date(),
    },
    { where: { id: chatId } },
  );

  // realtime chat message
  getIO().to(`chat-${chatId}`).emit("new-message", msg);
  console.log("🔥 emitting chat-list:update");

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

  return Messages.findAll({
    where: { chatId },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    include: [
      {
        model: MessageStatus,
        required: false,
        where: {
          userId,
          isDeleted: false,
        },
      },
    ],
  });
};

const editMessage = async (messageId, userId, content) => {
  const msg = await Messages.findByPk(messageId);
  if (!msg || msg.senderId !== userId) {
    throw new Error("Not allowed");
  }

  await msg.update({
    content,
  });
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
};

const deleteMessageForMe = async (messageId, userId) => {
  await MessageStatus.upsert({
    messageId,
    userId,
    isDeleted: true,
  });
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

  // decide type
  let type = "file";
  if (file.mimetype.startsWith("image/")) type = "image";
  else if (file.mimetype.startsWith("video/")) type = "file";

  const msg = await Messages.create({
    chatId,
    senderId: userId,
    type,
    content: null,
    fileUrl: file.path.replace(/\\/g, "/"),
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  });

  console.log(msg, "msggggg");

  // message status (delivered/sent)
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

  // realtime
  getIO().to(`chat-${chatId}`).emit("new-message", msg);

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

  // notification (send filename instead of content)
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
};
