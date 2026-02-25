const {
  GroupMembers,
  Users,
  UserSettings,
  Devices,
  Notification,
} = require("../models");
const { getIO, isUserOnline } = require("../socket/socket");
const { sendPushToUser } = require("../services/push.service");

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFY ON NEW MESSAGE
// ═══════════════════════════════════════════════════════════════════════════
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
        ],
      },
    ],
  });

  const notificationsToCreate = [];

  for (const member of members) {
    // Skip sender
    if (member.userId === senderId) {
      continue;
    }

    // Skip if chat is muted
    if (member.isMuted) {
      continue;
    }

    // Skip if global notifications are off
    if (!member.user?.user_setting?.pushNotifications) {
      continue;
    }

    // Add to bulk create array
    notificationsToCreate.push({
      userId: member.userId,
      senderId,
      chatId,
      type: "MESSAGE",
      title: "New Message",
      body: content.length > 50 ? content.substring(0, 50) + "..." : content,
    });
  }

  // Bulk create all notifications
  if (notificationsToCreate.length === 0) return;

  const createdNotifications = await Notification.bulkCreate(
    notificationsToCreate,
  );

  // Emit socket events and send push notifications
  for (const notification of createdNotifications) {
    // Get full notification with sender info
    const fullNotification = await Notification.findByPk(notification.id, {
      include: [
        {
          model: Users,
          as: "sender",
          attributes: ["id", "username", "profile_img"],
        },
      ],
    });

    // ✅ FIX: Changed "notification" to "new-notification"
    getIO()
      .to(`user-${notification.userId}`)
      .emit("new-notification", fullNotification);

    // Send push notification if user is offline
    if (!isUserOnline(notification.userId)) {
      await sendPushToUser(notification.userId, {
        title: fullNotification.title,
        body: fullNotification.body,
        data: {
          type: "message",
          chatId: String(chatId),
          senderId: String(senderId),
        },
      });
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFY GROUP EVENT
// ═══════════════════════════════════════════════════════════════════════════
const notifyGroupEvent = async ({
  chatId,
  senderId,
  type,
  title,
  body,
  onlyUserId = null,
}) => {
  const members = await GroupMembers.findAll({
    where: { chatId, leftAt: null },
  });

  const notificationsToCreate = [];

  for (const member of members) {
    // For GROUP_ADD -> notify only the added user
    if (onlyUserId && member.userId !== onlyUserId) {
      continue;
    }

    // Skip sender (except GROUP_ADD where sender is not the receiver)
    if (!onlyUserId && member.userId === senderId) {
      continue;
    }

    // ✅ FIX: Use the passed parameters, not undefined variables
    notificationsToCreate.push({
      userId: member.userId,
      senderId,
      chatId,
      type,   // ✅ FIXED
      title,  // ✅ FIXED
      body,   // ✅ FIXED
    });
  }

  // Bulk create all notifications
  if (notificationsToCreate.length === 0) return;

  const createdNotifications = await Notification.bulkCreate(
    notificationsToCreate,
  );

  // Emit socket events and send push notifications
  for (const notification of createdNotifications) {
    // Get full notification with sender info
    const fullNotification = await Notification.findByPk(notification.id, {
      include: [
        {
          model: Users,
          as: "sender",
          attributes: ["id", "username", "profile_img"],
        },
      ],
    });

    // ✅ FIX: Changed "notification" to "new-notification"
    getIO()
      .to(`user-${notification.userId}`)
      .emit("new-notification", fullNotification);

    // Send push notification if user is offline
    if (!isUserOnline(notification.userId)) {
      await sendPushToUser(notification.userId, {
        title: fullNotification.title,
        body: fullNotification.body,
        data: {
          type,
          chatId: String(chatId),
          senderId: senderId ? String(senderId) : null,
        },
      });
    }
  }
};

module.exports = {
  notifyOnNewMessage,
  notifyGroupEvent,
};