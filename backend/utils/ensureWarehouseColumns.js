const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

let ensured = false;

async function ensureWarehouseColumns() {
  if (ensured) return;

  const qi = sequelize.getQueryInterface();
  const table = await qi.describeTable("Warehouses");

  if (!table.idKho) {
    await qi.addColumn("Warehouses", "idKho", {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    });
    console.log("✅ Added column Warehouses.idKho");
  }

  try {
    await qi.addIndex("Warehouses", ["idKho"], {
      unique: true,
      name: "warehouses_idkho_unique",
    });
  } catch (err) {
    console.warn("warehouses_idkho_unique:", err.message);
  }

  ensured = true;
}

module.exports = { ensureWarehouseColumns };
