const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

const Vehicle = sequelize.define("Vehicle", {
  bienSo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  loaiXe: {
    type: DataTypes.STRING,
  },

  kho: {
    type: DataTypes.STRING,
  },

  trangThai: {
    type: DataTypes.STRING,
    defaultValue: "Hoạt động",
  },

  kmHienTai: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },

  ghiChu: {
    type: DataTypes.TEXT,
  },
});

module.exports = Vehicle;