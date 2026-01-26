const {
  Chats,
  Messages,
  MessageStatus,
  GroupMembers,
} = require("../../models");
const { notifyOnNewMessage } = require("../../notification/notificationHook");
const { getIO, isUserOnline } = require("../../socket/socket");
const { isMember } = require("../chats/chat.service");

const sendMessage = async (chatId, userId, content) => {
  await isMember(chatId, userId);

  const msg = await Messages.create({
    chatId,
    senderId: userId,
    content,
    type: "text",
  });

  const members = await GroupMembers.findAll({
    where: { chatId, leftAt: null, userId: { [Op.ne]: userId } },
    include: ["userId"],
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

  await msg.update({
    content: "This message was deleted",
    type: "system",
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

const sendFileMessage = async (chatId, userId, file) => {
  await isMember(chatId, userId);

  return Messages.create({
    chatId,
    senderId: userId,
    type: "file",
    fileUrl: file.path,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  }).then((msg) => {
    return msg;
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
};
