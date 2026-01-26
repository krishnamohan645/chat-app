const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RefreshTokens = sequelize.define("refresh_tokens", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tokenHash: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  // isRevoked: {
  //   type: DataTypes.BOOLEAN,
  //   defaultValue: false,
  // },
});

module.exports = RefreshTokens;
