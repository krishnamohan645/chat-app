const { Op, literal } = require("sequelize");
const { Chats, GroupMembers, Users } = require("../../models");
const { notifyGroupEvent } = require("../../notification/notificationHook");

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

const ensureGroupChat = async (chatId, userId,members=[]) => {
  const chat = await Chats.findByPk(chatId, { attributes: ["type"] });
  if(!chat || chat.type !== "group") {
    throw new Error("operation allowed only in group chats");
  }
  return chat;
}


// Services
const createPrivateChat = async (myId, otherUserId) => {
  if (!otherUserId) {
    throw new Error("otherUserId is required");
  }

  if (myId === otherUserId) {
    throw new Error("Cannot create private chat with yourself");
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

const createGroupChat = async (createdId, name, members = []) => {
  if (!name) {
    throw new Error("Group name is required");
  }

  if (!Array.isArray(members)) {
    throw new Error("Members must be an array");
  }

  const chat = await Chats.create({
    type: "group",
    name,
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
        attributes: ["id", "username", "profile_img"],
      },
    ],
  });
};

const addGroupMembers = async (chatId, userId, members = []) => {
  await ensureGroupChat(chatId);

  await isAdmin(chatId, userId);

  // get ALL records (active + left users)
  const existing = await GroupMembers.findAll({
    where: { chatId },
  });

  const activeMembers = existing
    .filter((m) => m.leftAt === null)
    .map((m) => m.userId);

  const leftMembers = existing
    .filter((m) => m.leftAt !== null)
    .map((m) => m.userId);

  // users never added before
  const toInsert = members.filter(
    (id) => !activeMembers.includes(id) && !leftMembers.includes(id),
  );

  // users who left earlier (restore)
  const toRestore = members.filter((id) => leftMembers.includes(id));

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

// const removeGroupMember = async (chatId, adminId, userId) => {
//   await isAdmin(chatId, adminId);

//   const target = await GroupMembers.findOne({
//     where: {
//       chatId,
//       userId,
//       leftAt: null,
//     },
//   });

//   if (!target) {
//     throw new Error("Member not found");
//   }

//   // remove member
//   await GroupMembers.update(
//     { leftAt: new Date(), role: "member" },
//     {
//       where: {
//         chatId,
//         userId,
//         // leftAt: null,
//       },
//     },
//   );

//   // if admin remove -> assign new admin
//   if (target.role === "admin") {
//     const nextAdmin = await GroupMembers.findOne({
//       where: {
//         chatId,
//         leftAt: null,
//       },
//       order: [["joinedAt", "ASC"]],
//     });
//     if (nextAdmin) {
//       await GroupMembers.update(
//         { role: "admin" },
//         { where: { id: nextAdmin.id } },
//       );
//     }
//   }
// };

const removeGroupMember = async (chatId, adminId, userId) => {
  await ensureGroupChat(chatId);

  await isAdmin(chatId, adminId);

  // admin cannot remove himself
  if (adminId === userId) {
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
};
