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

  ensured = true;
}

module.exports = { ensureAssignmentColumns };
