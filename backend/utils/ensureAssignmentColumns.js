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

  if (!table.soNvpTtt) {
    await qi.addColumn("Assignments", "soNvpTtt", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    console.log("✅ Added column Assignments.soNvpTtt");
  }

  if (!table.soDonGanGiao) {
    await qi.addColumn("Assignments", "soDonGanGiao", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    console.log("✅ Added column Assignments.soDonGanGiao");
  }

  if (!table.soDonGanLay) {
    await qi.addColumn("Assignments", "soDonGanLay", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    console.log("✅ Added column Assignments.soDonGanLay");
  }

  if (!table.odoCheckInMismatch) {
    await qi.addColumn("Assignments", "odoCheckInMismatch", {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    console.log("✅ Added column Assignments.odoCheckInMismatch");
  }

  if (!table.odoCheckOutMismatch) {
    await qi.addColumn("Assignments", "odoCheckOutMismatch", {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    console.log("✅ Added column Assignments.odoCheckOutMismatch");
  }

  if (!table.odoCheckInAi) {
    await qi.addColumn("Assignments", "odoCheckInAi", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    console.log("✅ Added column Assignments.odoCheckInAi");
  }

  if (!table.odoCheckOutAi) {
    await qi.addColumn("Assignments", "odoCheckOutAi", {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
    console.log("✅ Added column Assignments.odoCheckOutAi");
  }

  if (!table.duAn) {
    await qi.addColumn("Assignments", "duAn", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "GXT",
    });
    await sequelize.query(
      `UPDATE "Assignments" SET "duAn" = 'GXT' WHERE "duAn" IS NULL OR "duAn" = ''`
    );
    console.log("✅ Added column Assignments.duAn");
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
