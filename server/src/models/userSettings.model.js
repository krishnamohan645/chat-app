const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserSettings = sequelize.define("user_settings", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  showLastSeen: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  showReadReceipts: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = UserSettings;
