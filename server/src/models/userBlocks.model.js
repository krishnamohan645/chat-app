const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserBlocks = sequelize.define("user_blocks", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  blockerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  blockedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = UserBlocks;
