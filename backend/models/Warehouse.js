const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

const Warehouse = sequelize.define("Warehouse", {
  idKho: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },

  ten: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  loai: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "KHO",
  },

  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },

  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },

  // Bán kính cho phép Check In/Out (mét)
  banKinh: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
  },
});

module.exports = Warehouse;
