const { Op } = require("sequelize");
const sequelize = require("../database/database");
const User = require("../models/User");
const { parseKhoList, serializeKhoList } = require("./scopeHelpers");

let ensured = false;

async function ensureUserKhoColumn() {
  if (ensured) return;

  const qi = sequelize.getQueryInterface();
  const table = await qi.describeTable("Users");
  const kho = table.kho;

  if (kho && !/text/i.test(String(kho.type || ""))) {
    await sequelize.query('ALTER TABLE "Users" ALTER COLUMN "kho" TYPE TEXT');
    console.log("✅ Users.kho changed to TEXT");
  }

  const users = await User.findAll({
    where: {
      kho: {
        [Op.or]: [{ [Op.like]: "[%" }, { [Op.like]: "%|%" }],
      },
    },
  });

  for (const user of users) {
    const next = serializeKhoList(user.kho);
    if (next && next !== user.kho) {
      await user.update({ kho: next });
    }
  }

  ensured = true;
}

module.exports = { ensureUserKhoColumn };
