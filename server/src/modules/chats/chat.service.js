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
      userId: { [Op.in]: [userA, userB] },
      leftAt: null,
    },
    attributes: ["chatId"],
    group: ["chatId"],
    having: literal(`COUNT(DISTINCT "userId") = 2`),
  });

  const ids = chatIds.map((chat) => chat.chatId);
  if (!ids.length) return null;

  return Chats.findOne({
    where: { id: { [Op.in]: ids }, type: "private" },
  });
};

// Active members only (for write operations)
const isMember = async (chatId, userId) => {
  const member = await GroupMembers.findOne({
    where: { chatId, userId, leftAt: null },
  });
  if (!member) throw new Error("Not a member");
  return member;
};

// ✅ Active OR past member (for read operations — left users can still view)
const isMemberOrWasMember = async (chatId, userId) => {
  const member = await GroupMembers.findOne({
    where: { chatId, userId },
  });
  if (!member) throw new Error("Not a member of this group");
  return member;
};

const isAdmin = async (chatId, userId) => {
  const member = await isMember(chatId, userId);
  if (member.role !== "admin") throw new Error("Admin access required");
};

const ensureGroupChat = async (chatId) => {
  const chat = await Chats.findByPk(chatId, { attributes: ["type"] });
  if (!chat || chat.type !== "group") {
    throw new Error("operation allowed only in group chats");
  }
  return chat;
};

const createSystemMessage = async (chatId, content) => {
  const io = getIO();

  const msg = await Messages.create({
    chatId,
    senderId: null, // system messages have no sender
    type: "system",
    content,
  });

  io.to(`chat-${chatId}`).emit("receive-message", {
    id: msg.id,
    chatId: Number(chatId),
    type: "system",
    content,
    createdAt: msg.createdAt,
    senderId: null,
  });

  return msg;
};

// ─────────────────────────────────────────────────────────────────────────────
// Services
// ─────────────────────────────────────────────────────────────────────────────

const createPrivateChat = async (myId, otherUserId) => {
  if (!otherUserId) throw new Error("otherUserId is required");
  if (myId === otherUserId)
    throw new Error("Cannot create private chat with yourself");

  const isBlocked = await BlockedUser.findOne({
    where: {
      [Op.or]: [
        { blockerId: myId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: myId },
      ],
    },
  });
  if (isBlocked) throw new Error("You are blocked by the other user");

  const existingChat = await findExistingPrivateChat(myId, otherUserId);
  if (existingChat) return { chat: existingChat, isNew: false };

  const chat = await Chats.create({ type: "private", createdBy: myId });
  await GroupMembers.bulkCreate([
    { chatId: chat.id, userId: myId, role: "member", joinedAt: new Date() },
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
  if (!name) throw new Error("Group name is required");
  if (!Array.isArray(members)) throw new Error("Members must be an array");

  let groupImage = null;
  if (file) groupImage = "/uploads/images/" + file.filename;

  const chat = await Chats.create({
    type: "group",
    name,
    description,
    groupImage,
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
      { model: GroupMembers, attributes: ["userId", "role", "joinedAt"] },
    ],
  });
  return fullChat;
};

const getMyChats = async (userId, limit = 20) => {
  return Chats.findAll({
    include: [
      {
        model: GroupMembers,
        where: { userId, leftAt: null },
        attributes: [],
      },
    ],
    order: [["updatedAt", "DESC"]],
    limit,
  });
};

const getChatMembers = async (chatId, userId) => {
  await isMemberOrWasMember(chatId, userId);

  return GroupMembers.findAll({
    where: { chatId, leftAt: null },
    attributes: ["userId", "role", "joinedAt", "leftAt"], // ✅ Include all fields
    include: [
      {
        model: Users,
        as: "user",
        attributes: ["id", "username", "profile_img", "isOnline"], // ✅ Add isOnline
      },
    ],
  });
};

// ✅ Returns ALL members including those who left
// Used to resolve sender names on old messages
const getAllChatMembersIncludingLeft = async (chatId, userId) => {
  await isMemberOrWasMember(chatId, userId); // left users can call this too

  return GroupMembers.findAll({
    where: { chatId },
    attributes: ["userId", "role", "joinedAt", "leftAt"],
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

  const existing = await GroupMembers.findAll({ where: { chatId: chatIdNum } });

  const activeMembers = existing
    .filter((m) => m.leftAt === null)
    .map((m) => Number(m.userId));

  const leftMembers = existing
    .filter((m) => m.leftAt !== null)
    .map((m) => Number(m.userId));

  const toInsert = members.filter(
    (id) => !activeMembers.includes(id) && !leftMembers.includes(Number(id)),
  );
  const toRestore = members.filter((id) => leftMembers.includes(Number(id)));

  if (toRestore.length) {
    await GroupMembers.update(
      { leftAt: null },
      { where: { chatId, userId: toRestore } },
    );

    const io = getIO();

    const newCount = await GroupMembers.count({
      where: { chatId: chatIdNum, leftAt: null },
    });

    io.to(`chat-${chatId}`).emit("group:members-updated", {
      chatId: chatIdNum,
      memberCount: newCount,
    });

    for (const memberId of toRestore) {
      const user = await Users.findByPk(memberId, {
        attributes: ["username"],
      });

      await createSystemMessage(chatId, `${user.username} joined the group`);
    }
  }

  if (toInsert.length) {
    await GroupMembers.bulkCreate(
      toInsert.map((uid) => ({
        chatId,
        userId: uid,
        role: "member",
        joinedAt: new Date(),
      })),
    );

    const io = getIO();
    const newCount = await GroupMembers.count({
      where: { chatId: chatIdNum, leftAt: null },
    });
    console.log(
      "Emitting members-updated to room:",
      `chat-${chatId}`,
      newCount,
    );

    io.to(`chat-${chatId}`).emit("group:members-updated", {
      chatId: chatIdNum,
      memberCount: newCount,
    });

    // ✅ Saved to DB so it persists on reload
    for (const memberId of toInsert) {
      const user = await Users.findByPk(memberId, {
        attributes: ["username"],
      });

      await createSystemMessage(chatId, `${user.username} joined the group`);
    }

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

  if (Number(adminId) === Number(userId)) {
    throw new Error("Admin cannot remove himself");
  }

  const target = await GroupMembers.findOne({
    where: { chatId, userId, leftAt: null },
  });
  if (!target) throw new Error("Member not found");

  if (target.role === "admin") {
    const nextAdmin = await GroupMembers.findOne({
      where: { chatId, leftAt: null, userId: { [Op.ne]: userId } },
      order: [["joinedAt", "ASC"]],
    });
    if (nextAdmin) {
      await GroupMembers.update(
        { role: "admin" },
        { where: { id: nextAdmin.id } },
      );
    }
  }

  // ✅ TICK FIX: clear removed user's pending statuses so others get double-tick
  await MessageStatus.update(
    { status: "read" },
    {
      where: { userId, status: { [Op.ne]: "read" } },
      include: [
        {
          model: Messages,
          required: true,
          where: { chatId },
          attributes: [],
        },
      ],
    },
  );

  await GroupMembers.update(
    { leftAt: new Date(), role: "member" },
    { where: { chatId, userId } },
  );

  const io = getIO();
  const newCount = await GroupMembers.count({
    where: { chatId, leftAt: null },
  });

  console.log("Emitting members-updated to room:", `chat-${chatId}`, newCount);

  io.to(`chat-${chatId}`).emit("group:members-updated", {
    chatId: Number(chatId),
    memberCount: newCount,
  });

  // ✅ Saved to DB so it persists on reload
  // ✅ Get usernames for better system message
  const removedUser = await Users.findByPk(userId, {
    attributes: ["username"],
  });

  const adminUser = await Users.findByPk(adminId, {
    attributes: ["username"],
  });

  await createSystemMessage(
    chatId,
    `${removedUser.username} was removed by ${adminUser.username}`,
  );

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

  if (member.role === "admin") {
    const nextAdmin = await GroupMembers.findOne({
      where: { chatId, leftAt: null, userId: { [Op.ne]: userId } },
      order: [["joinedAt", "ASC"]],
    });
    if (nextAdmin) {
      await GroupMembers.update(
        { role: "admin" },
        { where: { id: nextAdmin.id } },
      );
    }
  }

  // ✅ TICK FIX: clear leaving user's pending statuses so others get double-tick
  await MessageStatus.update(
    { status: "read" },
    {
      where: { userId, status: { [Op.ne]: "read" } },
      include: [
        {
          model: Messages,
          required: true,
          where: { chatId },
          attributes: [],
        },
      ],
    },
  );

  await GroupMembers.update(
    { leftAt: new Date(), role: "member" },
    { where: { chatId, userId } },
  );

  const io = getIO();
  const newCount = await GroupMembers.count({
    where: { chatId, leftAt: null },
  });

  console.log("Emitting members-updated to room:", `chat-${chatId}`, newCount);

  io.to(`chat-${chatId}`).emit("group:members-updated", {
    chatId: Number(chatId),
    memberCount: newCount,
  });

  // ✅ Saved to DB so it persists on reload
  // ✅ Get username for system message
  const user = await Users.findByPk(userId, {
    attributes: ["username"],
  });

  await createSystemMessage(chatId, `${user.username} left the group`);

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
        where: { userId, leftAt: null },
        attributes: [],
      },
      {
        model: Users,
        attributes: ["id", "username", "profile_img"],
        through: { attributes: [] },
        where: { id: { [Op.ne]: userId } },
        required: false,
      },
    ],
    where: {
      [Op.or]: [
        { type: "group", name: { [Op.iLike]: `%${search}%` } },
        { type: "private", "$users.username$": { [Op.iLike]: `%${search}%` } },
      ],
    },
    order: [["updatedAt", "DESC"]],
    distinct: true,
  });
};

const getChatList = async (userId) => {
  // ✅ Fetch ALL chats the user was ever part of (active + left groups)
  const memberships = await GroupMembers.findAll({
    where: { userId },
    attributes: ["chatId", "leftAt"],
  });

  const chatIds = memberships.map((m) => m.chatId);
  if (!chatIds.length) return [];

  // Build a map of chatId → leftAt for quick lookup
  const leftAtMap = {};
  for (const m of memberships) {
    leftAtMap[m.chatId] = m.leftAt; // null means still active
  }

  const chats = await Chats.findAll({
    where: { id: { [Op.in]: chatIds } },
    order: [["updatedAt", "DESC"]],
  });

  const results = [];

  for (const chat of chats) {
    const userLeftAt = leftAtMap[chat.id]; // null = active, Date = left

    // For private chats, skip if user has left (private chats don't need "view after leave")
    if (chat.type === "private" && userLeftAt) continue;

    // ✅ Exclude system messages from last message preview
    const lastMessage = await Messages.findOne({
      where: {
        chatId: chat.id,
        type: { [Op.ne]: "system" },
      },
      order: [["createdAt", "DESC"]],
      include: [{ model: Users, attributes: ["username"] }],
    });

    // Unread count — only for active members (left members don't get new unreads)
    let unreadCount = 0;
    if (!userLeftAt) {
      unreadCount = await MessageStatus.count({
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
              type: { [Op.ne]: "system" },
            },
            attributes: [],
          },
        ],
      });
    }

    let name = null;
    let avatar = null;
    let isOnline = null;
    let lastSeen = null;
    let memberCount = null;
    let otherUserId = null;
    let isBlockedByMe = false;
    let hasBlockedMe = false;

    if (chat.type === "private") {
      const otherMember = await GroupMembers.findOne({
        where: { chatId: chat.id, userId: { [Op.ne]: userId }, leftAt: null },
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

      const blockedByMe = await BlockedUser.findOne({
        where: { blockerId: userId, blockedId: otherUserId },
      });
      const blockedMe = await BlockedUser.findOne({
        where: { blockerId: otherUserId, blockedId: userId },
      });
      isBlockedByMe = !!blockedByMe;
      hasBlockedMe = !!blockedMe;
    } else {
      name = chat.name;
      avatar = chat.groupImage;
      memberCount = await GroupMembers.count({
        where: { chatId: chat.id, leftAt: null },
      });
    }

    let previewText = null;
    if (lastMessage) {
      previewText =
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
    }

    results.push({
      chatId: chat.id,
      type: chat.type,
      otherUserId,
      name,
      profile_img: avatar,
      isOnline,
      lastSeen,
      memberCount,
      isBlockedByMe,
      hasBlockedMe,
      hasLeft: !!userLeftAt, // ✅ frontend uses this to show read-only mode
      leftAt: userLeftAt || null, // ✅ when exactly they left
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
  // ✅ Allow left members to view the chat (read-only)
  const membership = await GroupMembers.findOne({ where: { chatId, userId } });
  if (!membership) throw new Error("Chat not found");

  const chat = await Chats.findByPk(chatId);
  if (!chat) throw new Error("Chat not found");

  let result = {
    chatId: chat.id,
    type: chat.type,
    name: chat.name,
    isBlockedByMe: false,
    hasBlockedMe: false,
    otherUserId: null,
    hasLeft: !!membership.leftAt, // ✅ tells frontend if user has left
    leftAt: membership.leftAt || null,
  };

  if (chat.type === "private") {
    const otherMember = await GroupMembers.findOne({
      where: { chatId: chat.id, userId: { [Op.ne]: userId }, leftAt: null },
    });
    if (!otherMember) throw new Error("Other user not found");

    const otherUser = await Users.findByPk(otherMember.userId, {
      attributes: ["id", "username", "profile_img", "isOnline", "lastSeen"],
    });

    result.otherUserId = otherUser.id;
    result.name = otherUser.username;
    result.profile_img = otherUser.profile_img;
    result.isOnline = otherUser.isOnline;
    result.lastSeen = otherUser.isOnline ? null : otherUser.lastSeen;

    const blockedByMe = await BlockedUser.findOne({
      where: { blockerId: userId, blockedId: otherUser.id },
    });
    const blockedMe = await BlockedUser.findOne({
      where: { blockerId: otherUser.id, blockedId: userId },
    });
    result.isBlockedByMe = !!blockedByMe;
    result.hasBlockedMe = !!blockedMe;
  } else {
    result.memberCount = await GroupMembers.count({
      where: { chatId: chat.id, leftAt: null },
    });
    result.profile_img = chat.groupImage;
  }

  return result;
};

module.exports = {
  createPrivateChat,
  createGroupChat,
  getMyChats,
  getChatMembers,
  getAllChatMembersIncludingLeft,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
  muteChat,
  isMember,
  isMemberOrWasMember, // ✅ export for use in getMessages controller
  isAdmin,
  searchChats,
  getChatList,
  getSingleChat,
};
