const { DataTypes } = require("sequelize");
const sequelize = require("./database/database");

async function run() {

  const qi = sequelize.getQueryInterface();

  const table = await qi.describeTable("Assignments");

  const columns = [
    ["checkInDistanceMeters", { type: DataTypes.FLOAT, allowNull: true }],
    ["checkInGpsValid", { type: DataTypes.BOOLEAN, allowNull: true }],
    ["checkOutDistanceMeters", { type: DataTypes.FLOAT, allowNull: true }],
    ["checkOutGpsValid", { type: DataTypes.BOOLEAN, allowNull: true }],
  ];

  for (const [name, def] of columns) {
    if (!table[name]) {
      await qi.addColumn("Assignments", name, def);
      console.log(`✅ Added column ${name}`);
    } else {
      console.log(`↷ ${name} đã tồn tại`);
    }
  }

  console.log("🎉 Done. Assignments table đã sẵn sàng cho GPS distance tracking.");

  process.exit(0);

}

run().catch((err) => {
  console.error("❌ Lỗi migration:", err);
  process.exit(1);
});
