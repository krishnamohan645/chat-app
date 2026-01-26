const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Otps = sequelize.define("otps", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  identifier: {
    type: DataTypes.STRING, // email or mobile
    allowNull: false,
  },
  otpHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  purpose: {
    type: DataTypes.ENUM("signup", "login", "reset_password"),
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

module.exports = Otps;
