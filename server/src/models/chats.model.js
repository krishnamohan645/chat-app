const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Chats = sequelize.define("chats", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM("private", "group"),
    allowNull: false,
  },
  //   Only for group chats
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  groupImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.INTEGER, //userid
    allowNull: false,
  },
});

module.exports = Chats;
