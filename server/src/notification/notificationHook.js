const {
  GroupMembers,
  Users,
  UserSettings,
  Devices,
  Notification,
} = require("../models");
const { getIO } = require("../socket/socket");

const notifyOnNewMessage = async (chatId, senderId, content) => {
  const members = await GroupMembers.findAll({
    where: { chatId, leftAt: null },
    include: [
      {
        model: Users,
        as: "user",
        include: [
          {
            model: UserSettings,
            as: "user_setting",
            required: false,
          },
          {
            model: Devices,
            as: "devices",
            required: false,
          },
        ],
      },
    ],
  });

  console.log(
    "Notify check:",
    members.map((m) => ({
      userId: m.userId,
      isMuted: m.isMuted,
      hasSettings: !!m.user?.user_setting,
      push: m.user?.user_setting?.pushNotifications,
    })),
  );
  console.log(members[0]?.user, "userrrr");

  for (const member of members) {
    // skip sender
    if (member.userId === senderId) {
      continue;
    }

    // chat muted
    if (member.isMuted) {
      continue;
    }

    // Global notifications off
    if (!member.user.user_setting?.pushNotifications) {
      continue;
    }

    // create notification
    const notification = await Notification.create({
      userId: member.userId,
      senderId,
      chatId,
      type: "MESSAGE",
      title: "New Message",
      body: content.length > 50 ? content.substring(0, 50) + "..." : content,
    });

    getIO().to(`user-${member.userId}`).emit("notification", notification);
  }
};


const notifyGroupEvent = async ({
  chatId,
  senderId,
  type,
  title,
  body,
  onlyUserId = null, // used for Group_add
}) => {
  const members = await GroupMembers.findAll({
    where: { chatId, leftAt: null },
  });

  for (const member of members) {
    //for GROUP_ADD -> notify only added user
    if (onlyUserId && member.userId !== onlyUserId) {
      continue;
    }

    // Skip sender (except GROUP_ADD where sender not equal to receiver)
    if (!onlyUserId && member.userId === senderId) {
      continue;
    }

    const notification = await Notification.create({
      userId: member.userId,
      senderId,
      chatId,
      type,
      title,
      body,
    });

    getIO().to(`user-${member.userId}`).emit("notification", notification);
  }
};

module.exports = {
  notifyOnNewMessage,
  notifyGroupEvent,
};
