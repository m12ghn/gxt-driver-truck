const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

const Vehicle = require("./Vehicle");
const Driver = require("./Driver");

const Assignment = sequelize.define("Assignment", {
  ngay: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  ca: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  kho: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // ==========================
  // Trạng thái
  // ==========================
  trangThai: {
    type: DataTypes.STRING,
    defaultValue: "Chưa thực hiện",
  },

  // ==========================
  // Check In
  // ==========================
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  checkInLatitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },

  checkInLongitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },

  // Khoảng cách thực tế (mét) từ vị trí Check In tới kho.
  checkInDistanceMeters: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  // true = trong bán kính cho phép, false = tài xế đã chọn
  // "Tiếp tục Check In sai tọa độ", null = chưa xác định (chuyến cũ).
  checkInGpsValid: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },

  odoCheckIn: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  odoImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  frontImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  leftImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  rightImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  rearImage: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // Driver Portal - 6 ảnh chụp real-time lúc Check In
  // { matTruoc, matSau, hongTrai, hongPhai, banhSoCua, manOdo }
  checkInPhotos: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue("checkInPhotos");
      return raw ? JSON.parse(raw) : null;
    },
    set(value) {
      this.setDataValue(
        "checkInPhotos",
        value ? JSON.stringify(value) : null
      );
    },
  },

  // ==========================
  // Check Out
  // ==========================
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  checkOutLatitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },

  checkOutLongitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },

  // Khoảng cách thực tế (mét) từ vị trí Check Out tới kho.
  checkOutDistanceMeters: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  // true = trong bán kính cho phép, false = tài xế đã chọn
  // "Tiếp tục Check Out sai tọa độ", null = chưa xác định (chuyến cũ).
  checkOutGpsValid: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },

  odoCheckOut: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // Admin Check Out hộ khi driver quên Check Out
  checkOutBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  adminCheckoutReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // Driver Portal - 6 ảnh chụp real-time lúc Check Out
  checkOutPhotos: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue("checkOutPhotos");
      return raw ? JSON.parse(raw) : null;
    },
    set(value) {
      this.setDataValue(
        "checkOutPhotos",
        value ? JSON.stringify(value) : null
      );
    },
  },

  // ==========================
  // Kho xác nhận
  // Chỉ có giá trị khi chuyến đã "Hoàn thành" (đã Check Out)
  // ==========================
  warehouseStatus: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },

  warehouseReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  warehouseConfirmBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  warehouseConfirmTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  maChuyenDi: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

// ==========================
// Quan hệ
// ==========================
Vehicle.hasMany(Assignment, {
  foreignKey: "vehicleId",
});

Assignment.belongsTo(Vehicle, {
  foreignKey: "vehicleId",
});

Driver.hasMany(Assignment, {
  foreignKey: "driverId",
});

Assignment.belongsTo(Driver, {
  foreignKey: "driverId",
});

module.exports = Assignment;