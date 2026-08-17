const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

const Assignment = require("./Assignment");
const Driver = require("./Driver");
const Vehicle = require("./Vehicle");

const CheckIn = sequelize.define("CheckIn", {
  thoiGianCheckIn: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },

  odo: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  gpsLat: {
    type: DataTypes.DOUBLE,
  },

  gpsLng: {
    type: DataTypes.DOUBLE,
  },

  diaChi: {
    type: DataTypes.STRING,
  },

  anhODO: {
    type: DataTypes.STRING,
  },

  anhDauXe: {
    type: DataTypes.STRING,
  },

  anhHongTrai: {
    type: DataTypes.STRING,
  },

  anhHongPhai: {
    type: DataTypes.STRING,
  },

  anhDuoiXe: {
    type: DataTypes.STRING,
  },

  ghiChu: {
    type: DataTypes.TEXT,
  },

  trangThai: {
    type: DataTypes.STRING,
    defaultValue: "Đã Check In",
  },
});

// Quan hệ
Assignment.hasOne(CheckIn, {
  foreignKey: "assignmentId",
});

CheckIn.belongsTo(Assignment, {
  foreignKey: "assignmentId",
});

Driver.hasMany(CheckIn, {
  foreignKey: "driverId",
});

CheckIn.belongsTo(Driver, {
  foreignKey: "driverId",
});

Vehicle.hasMany(CheckIn, {
  foreignKey: "vehicleId",
});

CheckIn.belongsTo(Vehicle, {
  foreignKey: "vehicleId",
});

module.exports = CheckIn;