const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

let ensured = false;

async function ensureAssignmentColumns() {
  if (ensured) return;

  const qi = sequelize.getQueryInterface();
  const table = await qi.describeTable("Assignments");

  if (!table.maChuyenDi) {
    await qi.addColumn("Assignments", "maChuyenDi", {
      type: DataTypes.STRING,
      allowNull: true,
    });
    console.log("✅ Added column Assignments.maChuyenDi");
  }

  try {
    await qi.addIndex("Assignments", ["ngay", "vehicleId"], {
      unique: true,
      name: "assignments_ngay_vehicle_unique",
    });
  } catch (err) {
    console.warn("assignments_ngay_vehicle_unique:", err.message);
  }

  try {
    await qi.addIndex("Assignments", ["ngay", "driverId"], {
      unique: true,
      name: "assignments_ngay_driver_unique",
    });
  } catch (err) {
    console.warn("assignments_ngay_driver_unique:", err.message);
  }

  ensured = true;
}

module.exports = { ensureAssignmentColumns };
