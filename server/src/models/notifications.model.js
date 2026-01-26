const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define(
  "notifications",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    userId: {
      // receiver
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    senderId: {
      // who triggered it
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    chatId: {
      // related chat (if any)
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    type: {
      type: DataTypes.ENUM(
        "MESSAGE", // private + group messages
        "GROUP_ADD", // user added
        "GROUP_REMOVE", // user removed by admin
        "GROUP_LEAVE", // user left group
        "MENTION", // @mention
        "CALL", // voice call
        "VIDEO", // video call
        "SYSTEM", // security, password, etc
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
    },

    body: {
      type: DataTypes.TEXT,
    },

    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { timestamps: true },
);

module.exports = Notification;
