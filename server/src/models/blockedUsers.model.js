const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BlockedUser = sequelize.define(
  "blocked_user",
  {
    blockerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    blockedId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ["blockerId", "blockedId"],
      },
    ],
  },
);

module.exports = BlockedUser;
