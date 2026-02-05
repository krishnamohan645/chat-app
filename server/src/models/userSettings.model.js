const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserSettings = sequelize.define("user_settings", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  pushNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  messageSounds: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  emailNotifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastSeenVisibility: {
    type: DataTypes.ENUM("everyone", "only_me"),
    defaultValue: "everyone",
  },
  showReadReceipts: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  profilePhotoVisibility: {
    type: DataTypes.ENUM("everyone", "only_me"),
    defaultValue: "everyone",
  },
});

module.exports = UserSettings;
