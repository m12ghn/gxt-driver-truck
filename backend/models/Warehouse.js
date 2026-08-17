const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

const Warehouse = sequelize.define("Warehouse", {
  ten: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
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
