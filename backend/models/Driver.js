const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

const Driver = sequelize.define("Driver", {
  msnv: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  hoTen: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  soDienThoai: {
    type: DataTypes.STRING,
  },

  bangLai: {
    type: DataTypes.STRING,
  },

  loaiBang: {
    type: DataTypes.STRING,
  },

  kho: {
    type: DataTypes.STRING,
  },

  trangThai: {
    type: DataTypes.STRING,
    defaultValue: "Đang làm",
  },
});

module.exports = Driver;