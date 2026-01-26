// Import already-initialized models
const Users = require("./users.model");
const Chats = require("./chats.model");
const GroupMembers = require("./group_members.model");
const Messages = require("./message.model");
const MessageStatus = require("./messageStatus.model");
const Devices = require("./devices.model");
const Otps = require("./otps.model");
const RefreshTokens = require("./refreshTokens.model");
const UserSettings = require("./userSettings.model");
const UserBlocks = require("./userBlocks.model");
const Notification = require("./notifications.model");

// Run associations ONCE
require("../init_models/associations")({
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
});

// Export models
module.exports = {
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
};
