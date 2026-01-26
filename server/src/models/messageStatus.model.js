const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MessageStatus = sequelize.define(
  "message_status",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("read", "sent", "delivered"),
      defaultValue: "sent",
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["messageId", "userId"],
      },
    ],
  },
);

module.exports = MessageStatus;
