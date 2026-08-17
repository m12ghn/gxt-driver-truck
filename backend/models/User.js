const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

const User = sequelize.define("User", {
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
    allowNull: false,
    unique: true,
  },

  matKhau: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  quyen: {
    type: DataTypes.ENUM("ADMIN", "DRIVER", "WAREHOUSE"),
    allowNull: false,
  },

  // Kho phụ trách — bắt buộc với WAREHOUSE, dùng để scope dữ liệu
  kho: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  trangThai: {
    type: DataTypes.STRING,
    defaultValue: "Hoạt động",
  },
});

module.exports = User;