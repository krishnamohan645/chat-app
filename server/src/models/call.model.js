const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

const Call = sequelize.define("calls", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  callerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  type: {
    type: DataTypes.ENUM("audio", "video"),
    allowNull: false,
  },

  status: {
    type: DataTypes.ENUM(
      "calling",
      "ringing",
      "ongoing",
      "ended",
      "rejected",
      "missed"
    ),
    defaultValue: "calling", 
  },

  startedAt: {
    type: DataTypes.DATE,
  },

  endedAt: {
    type: DataTypes.DATE,
  },
});

module.exports = Call;
