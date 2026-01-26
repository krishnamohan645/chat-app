const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Message = sequelize.define(
  "message",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    chatId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    type: {
      type: DataTypes.ENUM("text", "image", "file", "system"),
      defaultValue: "text",
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    fileSize: {
      type: DataTypes.INTEGER, // bytes
      allowNull: true,
    },

    mimeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    indexes: [
      { fields: ["chatId"] },
      { fields: ["senderId"] },
      { fields: ["createdAt"] },
    ],
  },
);

module.exports = Message;
