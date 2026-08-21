const { DataTypes } = require("sequelize");
const sequelize = require("../database/database");

let ensured = false;

async function ensureUserKhoColumn() {
  if (ensured) return;

  const qi = sequelize.getQueryInterface();
  const table = await qi.describeTable("Users");
  const kho = table.kho;

  if (kho && !/text/i.test(String(kho.type || ""))) {
    await sequelize.query('ALTER TABLE "Users" ALTER COLUMN "kho" TYPE TEXT');
    console.log('✅ Users.kho changed to TEXT');
  }

  ensured = true;
}

module.exports = { ensureUserKhoColumn };
