const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Users = sequelize.define("users", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  profile_img: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  bio: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // isEmailVerified: {
  //   type: DataTypes.BOOLEAN,
  //   defaultValue: false,
  // },
  // isMobileVerified: {
  //   type: DataTypes.BOOLEAN,
  //   defaultValue: false,
  // },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  loginType: {
    type: DataTypes.ENUM("email", "mobile", "google"),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastPasswordChangeAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  statusMessage: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Users;
