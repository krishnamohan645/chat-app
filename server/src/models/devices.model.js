const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Devices = sequelize.define("devices", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  deviceType: {
    type: DataTypes.ENUM("android", "ios", "web"),
    allowNull: false,
  },
  pushToken: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastActiveAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

module.exports = Devices;
