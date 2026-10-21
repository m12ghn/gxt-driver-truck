const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");
const { parseKhoList } = require("../utils/scopeHelpers");

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

  // Kho phụ trách — bắt buộc với WAREHOUSE, có thể nhiều kho (JSON array)
  kho: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  khoList: {
    type: DataTypes.VIRTUAL,
    get() {
      return parseKhoList(this.getDataValue("kho"));
    },
  },

  trangThai: {
    type: DataTypes.STRING,
    defaultValue: "Hoạt động",
  },
});

// Không bao giờ trả cột mật khẩu ra ngoài API (kể cả khi controller quên loại bỏ).
User.prototype.toJSON = function toJSON() {
  const values = { ...this.get() };
  delete values.matKhau;
  return values;
};

module.exports = User;