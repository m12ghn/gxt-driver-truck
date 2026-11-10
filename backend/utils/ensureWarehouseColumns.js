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

  if (!table.loai) {
    await qi.addColumn("Warehouses", "loai", {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "KHO",
    });
    console.log("✅ Added column Warehouses.loai");
  }

  await sequelize.query(`
    UPDATE "Warehouses"
    SET "loai" = 'BUU_CUC'
    WHERE ("loai" IS NULL OR "loai" = '' OR "loai" = 'KHO')
      AND ("ten" ILIKE '%(HCM)%' OR "ten" ~* '(^|[[:space:]])CK([[:space:]]|$)')
  `);
  await sequelize.query(`
    UPDATE "Warehouses"
    SET "loai" = 'KHO'
    WHERE "loai" IS NULL OR "loai" = ''
  `);

  ensured = true;
}

module.exports = { ensureWarehouseColumns };
