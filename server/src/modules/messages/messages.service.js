const { Op } = require("sequelize");
const {
  Chats,
  Messages,
  MessageStatus,
  GroupMembers,
  BlockedUser,
  Users,
} = require("../../models");
const { notifyOnNewMessage } = require("../../notification/notificationHook");
const { getIO, isUserOnline } = require("../../socket/socket");
const { isMember, isMemberOrWasMember } = require("../chats/chat.service");
const { deleteFileIfExists } = require("../../utils/file.util");
const { decrypt, encrypt } = require("../../utils/crypto.util");

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

const isBlockedBetween = async (userA, userB) => {
  const block = await BlockedUser.findOne({
    where: {
      [Op.or]: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
  });

  return !!block;
};

const sendMessage = async (chatId, userId, content) => {
  console.log("🔥 sendMessage() CALLED");
  await isMember(chatId, userId);

  const receiverId = await getprivateChat(chatId, userId);

  if (receiverId) {
    if (receiverId && (await isBlockedBetween(userId, receiverId))) {
      throw new Error("You cannot send message to this user");
    }
  }
  const msg = await Messages.create({
    chatId,
    senderId: userId,
    content: encrypt(content),
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
  getIO().to(`chat-${chatId}`).emit("new-message", {
    id: msg.id,
    chatId: msg.chatId,
    senderId: msg.senderId,
    content: content, // ✅ Plain text (original parameter)
    type: msg.type,
    createdAt: msg.createdAt,
    isEdited: msg.isEdited,
    fileUrl: msg.fileUrl,
    fileName: msg.fileName,
    fileSize: msg.fileSize,
    mimeType: msg.mimeType,
  });
  console.log("🔥 emitting chat-list:update");

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

  const chat = await Chats.findByPk(chatId, {
    attributes: ["type"],
  });

  const sender = await Users.findByPk(userId, {
    attributes: ["username"],
  });

  const decryptedContent =
    msg.type === "text" && msg.content ? decrypt(msg.content) : null;

  chatMembers.forEach((member) => {
    getIO()
      .to(`user-${member.userId}`)
      .emit("chat-list:update", {
        chatId,
        type: chat.type,
        senderId: msg.senderId,
        lastMessage: {
          text:
            msg.type === "text"
              ? decryptedContent
              : msg.type === "image"
                ? "📷 Photo"
                : msg.type === "video"
                  ? "🎥 Video"
                  : msg.type === "audio"
                    ? "🎵 Audio"
                    : msg.type === "document"
                      ? "📄 Document"
                      : msg.type === "sticker"
                        ? "🎭 Sticker"
                        : "📎 File",
          createdAt: msg.createdAt,
          type: msg.type,
          senderId: msg.senderId,
          senderName: sender.username,
        },
      });
  });

  // notification hook
  await notifyOnNewMessage(chatId, userId, content);

  return msg;
};

const getMessages = async (chatId, userId, limit, offset) => {
  const membership = await isMemberOrWasMember(chatId, userId);

  console.log(`📨 Fetching messages for chat ${chatId}, user ${userId}`);

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

  // ✅ Build query with leftAt filter
  const whereClause = {
    chatId,
    id: { [Op.notIn]: deletedMessageIds.length ? deletedMessageIds : [0] },
  };

  // 🔥 If user has left, only show messages BEFORE they left
  if (membership.leftAt) {
    whereClause.createdAt = { [Op.lte]: membership.leftAt };
  }

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
      // content: m.content,
      content: m.content ? decrypt(m.content) : null,
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
    content: encrypt(content),
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

  // ✅ Delete from Cloudinary
  if (msg.cloudinaryId) {
    try {
      let resourceType = "raw";
      if (msg.type === "image") resourceType = "image";
      else if (msg.type === "video" || msg.type === "audio")
        resourceType = "video";

      await deleteFile(msg.cloudinaryId, resourceType);
      console.log("✅ Deleted from Cloudinary");
    } catch (error) {
      console.error("Failed to delete from Cloudinary:", error);
    }
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
    if (receiverId && (await isBlockedBetween(userId, receiverId))) {
      throw new Error("You cannot send message to this user");
    }
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

  // ✅ Upload to Cloudinary
  let uploaded;
  try {
    console.log("📤 Uploading chat file...");
    uploaded = await uploadChatFile(file);
    console.log("✅ Uploaded:", uploaded.fileUrl);
  } catch (error) {
    console.error("Failed to upload file:", error);
    throw new Error("Failed to upload file to cloud storage");
  }

  const msg = await Messages.create({
    chatId,
    senderId: userId,
    type,
    content: null,
    fileUrl: uploaded.fileUrl, // ✅ Cloudinary URL
    fileName: uploaded.fileName,
    fileSize: uploaded.fileSize,
    mimeType: uploaded.mimeType,
    cloudinaryId: uploaded.cloudinaryId, // ✅ For deletion
  });

  // ✅ CREATE MESSAGE STATUS
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

  // ✅ UPDATE CHAT TIMESTAMP
  await Chats.update({ updatedAt: new Date() }, { where: { id: chatId } });

  // ✅ EMIT NEW MESSAGE
  getIO().to(`chat-${chatId}`).emit("new-message", {
    id: msg.id,
    chatId: msg.chatId,
    senderId: msg.senderId,
    content: msg.content,
    type: msg.type,
    createdAt: msg.createdAt,
    isEdited: msg.isEdited,
    fileUrl: msg.fileUrl,
    fileName: msg.fileName,
    fileSize: msg.fileSize,
    mimeType: msg.mimeType,
  });

  // ✅ CHECK IF DELIVERED TO SOMEONE ONLINE (THIS WAS MISSING!)
  const deliveredToSomeone = members.some((m) => isUserOnline(m.userId));

  if (deliveredToSomeone) {
    getIO().to(`user-${userId}`).emit("message-delivered", {
      chatId,
      messageId: msg.id,
    });
  }

  // ✅ UPDATE CHAT LIST
  const chatMembers = await GroupMembers.findAll({
    where: {
      chatId,
      leftAt: null,
    },
  });

  const chat = await Chats.findByPk(chatId, {
    attributes: ["type"],
  });

  chatMembers.forEach((member) => {
    getIO()
      .to(`user-${member.userId}`)
      .emit("chat-list:update", {
        chatId,
        type: chat.type,
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

  // ✅ SEND NOTIFICATION
  await notifyOnNewMessage(chatId, userId, file.originalname || "media");

  return msg;
};

const searchMessages = async (chatId, userId, search) => {
  await isMember(chatId, userId);

  if (!search || search.trim() === "") {
    return [];
  }

  console.log(`🔍 Searching for "${search}" in chat ${chatId}`);

  // ✅ Fetch ALL text messages (they're encrypted in DB)
  const messages = await Messages.findAll({
    where: {
      chatId,
      type: "text",
    },
    order: [["createdAt", "DESC"]],
    limit: 500, // Reasonable limit
    raw: true,
  });

  console.log(`📦 Found ${messages.length} text messages to search`);

  // ✅ Decrypt and filter in memory
  const searchLower = search.toLowerCase();

  const matchingMessages = messages
    .map((msg) => {
      try {
        // Decrypt the message content
        const decryptedContent = msg.content ? decrypt(msg.content) : "";

        return {
          ...msg,
          content: decryptedContent,
        };
      } catch (error) {
        console.error(`❌ Failed to decrypt message ${msg.id}:`, error);
        return null;
      }
    })
    .filter((msg) => {
      // Remove null (failed decryptions)
      if (!msg) return false;

      // Check if decrypted content includes search term
      return msg.content.toLowerCase().includes(searchLower);
    })
    .slice(0, 50); // Return max 50 results

  console.log(`✅ Found ${matchingMessages.length} matching messages`);

  return matchingMessages;
};

const sendStickerMessage = async (chatId, userId, emoji) => {
  await isMember(chatId, userId);

  const receiverId = await getprivateChat(chatId, userId);

  if (receiverId && (await isBlockedBetween(userId, receiverId))) {
    throw new Error("You cannot send message to this user");
  }

  const msg = await Messages.create({
    chatId,
    senderId: userId,
    type: "sticker",
    content: emoji,
  });

  // ✅ CREATE MESSAGE STATUS for receivers
  const members = await GroupMembers.findAll({
    where: { chatId, leftAt: null, userId: { [Op.ne]: userId } },
  });

  await MessageStatus.bulkCreate(
    members.map((m) => ({
      messageId: msg.id,
      userId: m.userId,
      status: isUserOnline(m.userId) ? "delivered" : "sent",
    })),
  );

  // ✅ UPDATE CHAT TIMESTAMP
  await Chats.update({ updatedAt: new Date() }, { where: { id: chatId } });

  // ✅ EMIT NEW MESSAGE
  getIO().to(`chat-${chatId}`).emit("new-message", {
    id: msg.id,
    chatId: msg.chatId,
    senderId: msg.senderId,
    content: emoji, // ✅ Original emoji
    type: msg.type,
    createdAt: msg.createdAt,
    isEdited: false,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    mimeType: null,
  });

  // ✅ CHECK IF DELIVERED TO SOMEONE ONLINE
  const deliveredToSomeone = members.some((m) => isUserOnline(m.userId));

  if (deliveredToSomeone) {
    getIO().to(`user-${userId}`).emit("message-delivered", {
      chatId,
      messageId: msg.id,
    });
  }

  // ✅ UPDATE CHAT LIST for all members
  const chatMembers = await GroupMembers.findAll({
    where: {
      chatId,
      leftAt: null,
    },
  });

  const chat = await Chats.findByPk(chatId, {
    attributes: ["type"],
  });

  chatMembers.forEach((member) => {
    getIO()
      .to(`user-${member.userId}`)
      .emit("chat-list:update", {
        chatId,
        type: chat.type,
        senderId: msg.senderId,
        lastMessage: {
          text: "🎭 Sticker",
          createdAt: msg.createdAt,
          type: msg.type,
        },
      });
  });

  // ✅ SEND NOTIFICATION
  await notifyOnNewMessage(chatId, userId, "Sticker");

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
