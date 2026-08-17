const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");
const Assignment = require("./Assignment");

// Báo cáo sự cố / sửa chữa dọc đường (giữa Check In và Check Out)
const IncidentReport = sequelize.define("IncidentReport", {
  loai: {
    type: DataTypes.STRING,
    allowNull: false,
    // "Sự cố" | "Sửa chữa"
  },

  moTa: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },

  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },

  // Mảng đường dẫn ảnh JSON: ["/uploads/incidents/..."]
  photos: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue("photos");
      if (!raw) return [];
      try {
        return typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue(
        "photos",
        typeof value === "string" ? value : JSON.stringify(value || [])
      );
    },
  },

  reportedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

Assignment.hasMany(IncidentReport, {
  foreignKey: "assignmentId",
  as: "incidents",
});

IncidentReport.belongsTo(Assignment, {
  foreignKey: "assignmentId",
});

module.exports = IncidentReport;
