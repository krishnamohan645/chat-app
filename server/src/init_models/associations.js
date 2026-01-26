module.exports = ({
  Users,
  Chats,
  GroupMembers,
  Messages,
  MessageStatus,
  Devices,
  Otps,
  RefreshTokens,
  UserSettings,
  UserBlocks,
  Notification,
}) => {
  // Users ↔ Chats (M:M)
  Users.belongsToMany(Chats, {
    through: GroupMembers,
    foreignKey: "userId",
  });
  Chats.belongsToMany(Users, {
    through: GroupMembers,
    foreignKey: "chatId",
  });

  Chats.hasMany(GroupMembers, { foreignKey: "chatId" });
  GroupMembers.belongsTo(Chats, { foreignKey: "chatId" });

  Users.hasMany(GroupMembers, { foreignKey: "userId" });
  GroupMembers.belongsTo(Users, { foreignKey: "userId", as: "user" });

  // Chats → Messages
  Chats.hasMany(Messages, { foreignKey: "chatId" });
  Messages.belongsTo(Chats, { foreignKey: "chatId" });

  // Users → Messages
  Users.hasMany(Messages, { foreignKey: "senderId" });
  Messages.belongsTo(Users, { foreignKey: "senderId" });

  // Messages → MessageStatus
  Messages.hasMany(MessageStatus, { foreignKey: "messageId" });
  MessageStatus.belongsTo(Messages, { foreignKey: "messageId" });

  // Users → Devices
  Users.hasMany(Devices, { foreignKey: "userId" });
  Devices.belongsTo(Users, { foreignKey: "userId", as: "user" });

  // Users → Otps
  Users.hasMany(Otps, { foreignKey: "userId" });
  Otps.belongsTo(Users, { foreignKey: "userId" });

  // Users → RefreshTokens
  Users.hasMany(RefreshTokens, { foreignKey: "userId" });
  RefreshTokens.belongsTo(Users, { foreignKey: "userId" });

  // Users → UserSettings (1:1)
  Users.hasOne(UserSettings, { foreignKey: "userId" , as: "user_setting" });
  UserSettings.belongsTo(Users, { foreignKey: "userId" });

  // User Blocks (self join)
  Users.belongsToMany(Users, {
    through: UserBlocks,
    as: "BlockedUsers",
    foreignKey: "blockerId",
    otherKey: "blockedId",
  });

  // Notifications → Users
  Users.hasMany(Notification, { foreignKey: "userId" });
  Notification.belongsTo(Users, { foreignKey: "userId" });

  // Notifications → Users (sender)
  Users.hasMany(Notification, { foreignKey: "senderId" });
  Notification.belongsTo(Users, { foreignKey: "senderId" });

  // Notifications → Chats
  Chats.hasMany(Notification, { foreignKey: "chatId" });
  Notification.belongsTo(Chats, { foreignKey: "chatId" });
};
