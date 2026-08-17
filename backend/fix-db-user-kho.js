const { DataTypes } = require("sequelize");
const sequelize = require("./database/database");

async function run() {
  const qi = sequelize.getQueryInterface();
  const table = await qi.describeTable("Users");

  if (!table.kho) {
    await qi.addColumn("Users", "kho", {
      type: DataTypes.STRING,
      allowNull: true,
    });
    console.log("Added Users.kho");
  } else {
    console.log("Users.kho already exists");
  }

  // Gán kho mặc định cho user WAREHOUSE chưa có kho (demo)
  const [updated] = await sequelize.query(`
    UPDATE Users
    SET kho = 'Tân Thuận'
    WHERE quyen = 'WAREHOUSE'
      AND (kho IS NULL OR kho = '')
  `);

  console.log("WAREHOUSE users updated:", updated);
  await sequelize.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
