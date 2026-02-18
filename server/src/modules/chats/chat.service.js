const { Op, literal, fn, col } = require("sequelize");
const {
  Chats,
  GroupMembers,
  Users,
  BlockedUser,
  Messages,
  MessageStatus,
} = require("../../models");
const { notifyGroupEvent } = require("../../notification/notificationHook");
const { getIO } = require("../../socket/socket");

// Helpers
const findExistingPrivateChat = async (userA, userB) => {
  const chatIds = await GroupMembers.findAll({
    where: {
      userId: {
        [Op.in]: [userA, userB],
      },
      leftAt: null,
    },
    attributes: ["chatId"],
    group: ["chatId"],
    having: literal(`COUNT(DISTINCT "userId") = 2`),
  });

  const ids = chatIds.map((chat) => chat.chatId);

  if (!ids.length) return null;

  return Chats.findOne({
    where: {
      id: {
        [Op.in]: ids,
      },
      type: "private",
    },
  });
};

const isMember = async (chatId, userId) => {
  const member = await GroupMembers.findOne({
    where: {
      chatId,
      userId,
      leftAt: null,
    },
  });
  if (!member) throw new Error("Not a member");
  return member;
};

const isAdmin = async (chatId, userId) => {
  const member = await isMember(chatId, userId);
  if (member.role !== "admin") {
    throw new Error("Admin access required");
  }
};

const ensureGroupChat = async (chatId, userId, members = []) => {
  const chat = await Chats.findByPk(chatId, { attributes: ["type"] });
  if (!chat || chat.type !== "group") {
    throw new Error("operation allowed only in group chats");
  }
  return chat;
};

// Services
const createPrivateChat = async (myId, otherUserId) => {
  if (!otherUserId) {
    throw new Error("otherUserId is required");
  }

  if (myId === otherUserId) {
    throw new Error("Cannot create private chat with yourself");
  }

  const isBlocked = await BlockedUser.findOne({
    where: {
      [Op.or]: [
        { blockerId: myId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: myId },
      ],
    },
  });

  if (isBlocked) {
    throw new Error("You are blocked by the other user");
  }

  const existingChat = await findExistingPrivateChat(myId, otherUserId);

  if (existingChat)
    return {
      chat: existingChat,
      isNew: false,
    };

  const chat = await Chats.create({
    type: "private",
    createdBy: myId,
  });

  await GroupMembers.bulkCreate([
    {
      chatId: chat.id,
      userId: myId,
      role: "member",
      joinedAt: new Date(),
    },
    {
      chatId: chat.id,
      userId: otherUserId,
      role: "member",
      joinedAt: new Date(),
    },
  ]);

  return { chat, isNew: true };
};

const createGroupChat = async (
  createdId,
  name,
  members = [],
  description,
  file,
) => {
  if (!name) {
    throw new Error("Group name is required");
  }

  if (!Array.isArray(members)) {
    throw new Error("Members must be an array");
  }

  let groupImage = null;
  if (file) {
    groupImage = "/uploads/images/" + file.filename;
  }

  const chat = await Chats.create({
    type: "group",
    name,
    description,
    groupImage: groupImage,
    createdBy: createdId,
  });

  const uniqueMembers = [...new Set([...members, createdId])];

  await GroupMembers.bulkCreate(
    uniqueMembers.map((userId) => ({
      chatId: chat.id,
      userId,
      role: userId === createdId ? "admin" : "member",
      joinedAt: new Date(),
    })),
  );

  const fullChat = await Chats.findByPk(chat.id, {
    include: [
      {
        model: GroupMembers,
        attributes: ["userId", "role", "joinedAt"],
      },
    ],
  });
  return fullChat;
};

const getMyChats = async (userId, limit = 20) => {
  return Chats.findAll({
    include: [
      {
        model: GroupMembers,
        where: {
          userId,
          leftAt: null,
        },
        attributes: [],
      },
    ],
    order: [["updatedAt", "DESC"]],
    limit,
  });
};

const getChatMembers = async (chatId, userId) => {
  await isMember(chatId, userId);

  return GroupMembers.findAll({
    where: {
      chatId,
      leftAt: null,
    },
    include: [
      {
        model: Users,
        as: "user",
        attributes: ["id", "username", "profile_img"],
      },
    ],
  });
};

const addGroupMembers = async (chatId, userId, members = []) => {
  const chatIdNum = Number(chatId);

  await ensureGroupChat(chatIdNum);
  await isAdmin(chatIdNum, userId);

  // get ALL records (active + left users)
  const existing = await GroupMembers.findAll({
    where: { chatId: chatIdNum },
  });

  const activeMembers = existing
    .filter((m) => m.leftAt === null)
    .map((m) => Number(m.userId));

  const leftMembers = existing
    .filter((m) => m.leftAt !== null)
    .map((m) => Number(m.userId));

  // users never added before
  const toInsert = members.filter(
    (id) => !activeMembers.includes(id) && !leftMembers.includes(Number(id)),
  );

  // users who left earlier (restore)
  const toRestore = members.filter((id) => leftMembers.includes(Number(id)));

  // restore old members
  if (toRestore.length) {
    await GroupMembers.update(
      { leftAt: null },
      { where: { chatId, userId: toRestore } },
    );

    // notify restored members
    for (const memberId of toRestore) {
      await notifyGroupEvent({
        chatId,
        senderId: userId,
        type: "GROUP_ADD",
        title: "Added to Group",
        body: "You have been added back to the group",
        onlyUserId: memberId,
      });
    }
  }

  // insert new members
  if (toInsert.length) {
    await GroupMembers.bulkCreate(
      toInsert.map((userId) => ({
        chatId,
        userId,
        role: "member",
        joinedAt: new Date(),
      })),
    );

    const io = getIO();

    const newCount = await GroupMembers.count({
      where: { chatIdNum, leftAt: null },
    });

    io.to(`chat-${chatId}`).emit("group:members-updated", {
      chatId: chatIdNum,
      memberCount: newCount,
    });

    io.to(`user-${userId}`).emit("receive-message", {
      chatId: chatIdNum,
      type: "system",
      content: `${toInsert.length} new member(s) added to the group`,
      createdAt: new Date().toISOString(),
      id: Date.now(),
    });

    // notify new members
    for (const memberId of toInsert) {
      await notifyGroupEvent({
        chatId,
        senderId: userId,
        type: "GROUP_ADD",
        title: "Added to Group",
        body: "You have been added to the group",
        onlyUserId: memberId,
      });
    }
  }

  if (!toInsert.length && !toRestore.length) {
    return { message: "No new members to add" };
  }

  return { message: "Members added successfully" };
};

const removeGroupMember = async (chatId, adminId, userId) => {
  await ensureGroupChat(chatId);
  await isAdmin(chatId, adminId);

  // admin cannot remove himself
  if (Number(adminId) === Number(userId)) {
    throw new Error("Admin cannot remove himself");
  }

  const target = await GroupMembers.findOne({
    where: {
      chatId,
      userId,
      leftAt: null,
    },
  });

  if (!target) {
    throw new Error("Member not found");
  }

  // if admin is being removed → assign new admin first
  if (target.role === "admin") {
    const nextAdmin = await GroupMembers.findOne({
      where: {
        chatId,
        leftAt: null,
        userId: { [Op.ne]: userId },
      },
      order: [["joinedAt", "ASC"]],
    });

    if (nextAdmin) {
      await GroupMembers.update(
        { role: "admin" },
        { where: { id: nextAdmin.id } },
      );
    }
  }

  // remove member
  await GroupMembers.update(
    { leftAt: new Date(), role: "member" },
    {
      where: {
        chatId,
        userId,
      },
    },
  );

  // ✅ emit socket events
  const io = getIO();
  const newCount = await GroupMembers.count({
    where: { chatId, leftAt: null },
  });

  io.to(`chat-${chatId}`).emit("group:members-updated", {
    chatId: Number(chatId),
    memberCount: newCount,
  });

  io.to(`chat-${chatId}`).emit("receive-message", {
    chatId: Number(chatId),
    type: "system",
    content: "A member was removed from the group",
    createdAt: new Date().toISOString(),
    id: Date.now(),
  });

  // 🔔 notify removed member
  await notifyGroupEvent({
    chatId,
    senderId: adminId,
    type: "GROUP_REMOVE",
    title: "Removed from Group",
    body: "You have been removed from the group",
    onlyUserId: userId,
  });
};

const leaveGroup = async (chatId, userId) => {
  await ensureGroupChat(chatId);
  const member = await isMember(chatId, userId);

  // if admin leaves → assign new admin FIRST
  if (member.role === "admin") {
    const nextAdmin = await GroupMembers.findOne({
      where: {
        chatId,
        leftAt: null,
        userId: { [Op.ne]: userId },
      },
      order: [["joinedAt", "ASC"]],
    });

    if (nextAdmin) {
      await GroupMembers.update(
        { role: "admin" },
        { where: { id: nextAdmin.id } },
      );
    }
  }

  // mark user as left
  await GroupMembers.update(
    { leftAt: new Date(), role: "member" },
    { where: { chatId, userId } },
  );

  const io = getIO();
  const newCount = await GroupMembers.count({
    where: { chatId, leftAt: null },
  });

  io.to(String(chatId)).emit("group:members-updated", {
    chatId: Number(chatId),
    memberCount: newCount,
  });

  io.to(String(chatId)).emit("receive-message", {
    chatId: Number(chatId),
    type: "system",
    content: "A member left the group",
    createdAt: new Date().toISOString(),
    id: Date.now(),
  });

  // In removeGroupMember — same pattern
  io.to(String(chatId)).emit("group:members-updated", {
    chatId: Number(chatId),
    memberCount: newCount,
  });

  io.to(String(chatId)).emit("receive-message", {
    chatId: Number(chatId),
    type: "system",
    content: "A member was removed from the group",
    createdAt: new Date().toISOString(),
    id: Date.now(),
  });

  // 🔔 notify remaining group members
  await notifyGroupEvent({
    chatId,
    senderId: userId,
    type: "GROUP_LEAVE",
    title: "Member Left",
    body: "A member has left the group",
  });
};

const muteChat = async (chatId, userId, mute) => {
  await isMember(chatId, userId);

  await GroupMembers.update(
    { isMuted: mute },
    { where: { chatId, userId, leftAt: null } },
  );
};

const searchChats = async (userId, search) => {
  return Chats.findAll({
    include: [
      {
        model: GroupMembers,
        where: {
          userId,
          leftAt: null,
        },
        attributes: [],
      },
      {
        model: Users,
        attributes: ["id", "username", "profile_img"],
        through: { attributes: [] },
        where: {
          id: { [Op.ne]: userId },
        },
        required: false,
      },
    ],

    where: {
      [Op.or]: [
        // ✅ GROUP chats → match group name only
        {
          type: "group",
          name: {
            [Op.iLike]: `%${search}%`,
          },
        },

        // ✅ PRIVATE chats → match other user's name only
        {
          type: "private",
          "$users.username$": {
            [Op.iLike]: `%${search}%`,
          },
        },
      ],
    },

    order: [["updatedAt", "DESC"]],
    distinct: true,
  });
};

const getChatList = async (userId) => {
  const chats = await Chats.findAll({
    include: [
      {
        model: GroupMembers,
        where: { userId, leftAt: null },
        attributes: [],
      },
    ],
    order: [["updatedAt", "DESC"]],
  });

  const results = [];

  for (const chat of chats) {
    const lastMessage = await Messages.findOne({
      where: { chatId: chat.id },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Users,
          attributes: ["username"],
        },
      ],
    });

    const unreadCount = await MessageStatus.count({
      where: {
        userId,
        status: { [Op.ne]: "read" },
      },
      include: [
        {
          model: Messages,
          required: true,
          where: {
            chatId: chat.id,
            senderId: { [Op.ne]: userId },
          },
          attributes: [],
        },
      ],
    });

    let name = null;
    let avatar = null;
    let isOnline = null;
    let lastSeen = null;
    let memberCount = null;
    let otherUserId = null;
    let isBlockedByMe = false; // ✅ Add this
    let hasBlockedMe = false; // ✅ Add this

    if (chat.type === "private") {
      const otherMember = await GroupMembers.findOne({
        where: {
          chatId: chat.id,
          userId: { [Op.ne]: userId },
          leftAt: null,
        },
      });

      if (!otherMember) continue;

      const otherUser = await Users.findByPk(otherMember.userId, {
        attributes: ["id", "username", "profile_img", "isOnline", "lastSeen"],
      });

      otherUserId = otherUser.id;
      name = otherUser.username;
      avatar = otherUser.profile_img;
      isOnline = otherUser.isOnline;
      lastSeen = otherUser.isOnline ? null : otherUser.lastSeen;

      // ✅ Check block status for private chats
      const blockedByMe = await BlockedUser.findOne({
        where: {
          blockerId: userId,
          blockedId: otherUserId,
        },
      });

      const blockedMe = await BlockedUser.findOne({
        where: {
          blockerId: otherUserId,
          blockedId: userId,
        },
      });

      isBlockedByMe = !!blockedByMe;
      hasBlockedMe = !!blockedMe;
    } else {
      // group chat
      name = chat.name;
      avatar = chat.groupImage;
      memberCount = await GroupMembers.count({
        where: { chatId: chat.id, leftAt: null },
      });
    }

    let previewText = null;

    if (lastMessage) {
      const messageText =
        lastMessage.type === "text"
          ? lastMessage.content
          : lastMessage.type === "image"
            ? "📷 Photo"
            : lastMessage.type === "video"
              ? "🎥 Video"
              : lastMessage.type === "audio"
                ? "🎵 Audio"
                : lastMessage.type === "document"
                  ? "📄 Document"
                  : lastMessage.type === "file"
                    ? "📎 File"
                    : lastMessage.content;

      if (chat.type === "group") {
        previewText = messageText;
      } else {
        previewText = messageText;
      }
    }

    console.log(lastMessage?.user?.username, "lastMessage?.user?.username");

    results.push({
      chatId: chat.id,
      type: chat.type,
      otherUserId,
      name,
      profile_img: avatar,
      isOnline,
      lastSeen,
      memberCount,
      isBlockedByMe, // ✅ Add this
      hasBlockedMe, // ✅ Add this
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            text: previewText,
            type: lastMessage.type,
            senderId: lastMessage.senderId,
            senderName: lastMessage?.user?.username || null,
            createdAt: lastMessage.createdAt,
          }
        : null,
      lastMessageAt: lastMessage?.createdAt || null,
      unreadCount,
    });
  }

  return results;
};

const getSingleChat = async (chatId, userId) => {
  // Verify user is a member
  await isMember(chatId, userId);

  const chat = await Chats.findByPk(chatId);

  if (!chat) {
    throw new Error("Chat not found");
  }

  let result = {
    chatId: chat.id,
    type: chat.type,
    name: chat.name,
    isBlockedByMe: false,
    hasBlockedMe: false,
    otherUserId: null,
  };

  if (chat.type === "private") {
    // Get the other user
    const otherMember = await GroupMembers.findOne({
      where: {
        chatId: chat.id,
        userId: { [Op.ne]: userId },
        leftAt: null,
      },
    });

    if (!otherMember) {
      throw new Error("Other user not found");
    }

    const otherUser = await Users.findByPk(otherMember.userId, {
      attributes: ["id", "username", "profile_img", "isOnline", "lastSeen"],
    });

    result.otherUserId = otherUser.id;
    result.name = otherUser.username;
    result.profile_img = otherUser.profile_img;
    result.isOnline = otherUser.isOnline;
    result.lastSeen = otherUser.isOnline ? null : otherUser.lastSeen;

    // Check block status
    const blockedByMe = await BlockedUser.findOne({
      where: {
        blockerId: userId,
        blockedId: otherUser.id,
      },
    });

    const blockedMe = await BlockedUser.findOne({
      where: {
        blockerId: otherUser.id,
        blockedId: userId,
      },
    });

    result.isBlockedByMe = !!blockedByMe;
    result.hasBlockedMe = !!blockedMe;
  } else {
    // Group chat
    const memberCount = await GroupMembers.count({
      where: { chatId: chat.id, leftAt: null },
    });
    result.memberCount = memberCount;
  }

  return result;
};

module.exports = {
  createPrivateChat,
  createGroupChat,
  getMyChats,
  getChatMembers,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  muteChat,
  isMember,
  isAdmin,
  searchChats,
  getChatList,
  getSingleChat,
};
