const Warehouse = require("../models/Warehouse");
const sequelize = require("../database/database");
const { DEFAULT_WAREHOUSES } = require("../constants/warehouses");

const KHO_RENAMES = {
  "Kho Trung Chuyển Hồ Chí Minh 01": "Kho Giao Hàng Nặng - Hồ Chí Minh",
};

// Tên ngắn cũ (Excel / phân công) → tên kho GHN đầy đủ.
const SHORT_TO_OFFICIAL = {
  "Tân Bình": "Kho Giao Hàng Nặng - Tân Bình - HCM",
  "Tân Tạo": "Kho Giao Hàng Nặng - Tân Tạo - HCM",
  "Tân Thuận": "Kho Giao Hàng Nặng - Tân Thuận - HCM",
  "Thủ Đức": "Kho Giao Hàng Nặng - Thủ Đức - HCM",
  "Nhà Bè": "Kho Giao Hàng Nặng - Nhà Bè - HCM",
  "Sóng Thần": "Kho Chuyển Tiếp Sóng Thần-Bình Dương",
  "Xuyên Á": "Kho Giao Hàng Nặng - Hồ Chí Minh",
};

let ensured = false;

async function rewriteKhoValue(from, to) {
  if (!from || !to || from === to) return;

  for (const table of ["Assignments", "Vehicles", "Drivers"]) {
    await sequelize.query(
      `UPDATE "${table}" SET kho = :to WHERE kho = :from`,
      { replacements: { from, to } }
    );
  }

  await sequelize.query(`UPDATE "Users" SET kho = :to WHERE kho = :from`, {
    replacements: { from, to },
  });

  await sequelize.query(
    `UPDATE "Users" SET kho = REPLACE(kho, :quotedFrom, :quotedTo) WHERE kho LIKE :like`,
    {
      replacements: {
        quotedFrom: `"${from}"`,
        quotedTo: `"${to}"`,
        like: `%"${from}"%`,
      },
    }
  );
}

async function applyWarehouseRenames() {
  for (const [from, to] of Object.entries(KHO_RENAMES)) {
    const oldRow = await Warehouse.findOne({ where: { ten: from } });
    const newRow = await Warehouse.findOne({ where: { ten: to } });

    if (oldRow && !newRow) {
      await oldRow.update({ ten: to });
    } else if (oldRow && newRow) {
      await oldRow.destroy();
    }

    await rewriteKhoValue(from, to);
  }
}

async function applyShortNameRewrites() {
  for (const [from, to] of Object.entries(SHORT_TO_OFFICIAL)) {
    await rewriteKhoValue(from, to);

    const shortRow = await Warehouse.findOne({ where: { ten: from } });
    const officialRow = await Warehouse.findOne({ where: { ten: to } });

    if (shortRow && officialRow) {
      await shortRow.destroy();
    } else if (shortRow && !officialRow) {
      await shortRow.update({ ten: to });
    }
  }
}

async function ensureWarehouses() {
  if (ensured) return;

  try {
    await applyWarehouseRenames();
  } catch (err) {
    console.warn("applyWarehouseRenames:", err.message);
  }

  try {
    await applyShortNameRewrites();
  } catch (err) {
    console.warn("applyShortNameRewrites:", err.message);
  }

  try {
    for (const item of DEFAULT_WAREHOUSES) {
      await Warehouse.findOrCreate({
        where: { ten: item.ten },
        defaults: item,
      });
    }
  } catch (err) {
    console.warn("ensureWarehouses seed:", err.message);
  }

  ensured = true;
}

function normalizeKhoName(kho) {
  const name = String(kho || "").trim();
  const renamed = KHO_RENAMES[name] || name;
  return SHORT_TO_OFFICIAL[renamed] || SHORT_TO_OFFICIAL[name] || renamed;
}

async function findWarehouseByName(ten) {
  const name = String(ten || "").trim();
  if (!name) return null;

  const official = normalizeKhoName(name);

  const byOfficial = await Warehouse.findOne({ where: { ten: official } });
  if (byOfficial) return byOfficial;

  if (official !== name) {
    const exact = await Warehouse.findOne({ where: { ten: name } });
    if (exact) return exact;
  }

  const all = await Warehouse.findAll();
  const needle = official.toLowerCase();

  return (
    all.find((w) => String(w.ten || "").trim().toLowerCase() === needle) ||
    all.find(
      (w) =>
        /^Kho /i.test(String(w.ten || "")) &&
        String(w.ten || "").toLowerCase() === needle
    ) ||
    null
  );
}

async function resolveWarehouseForAssignment(assignment) {
  const official = normalizeKhoName(assignment?.kho);
  if (assignment && official && official !== assignment.kho) {
    try {
      await assignment.update({ kho: official });
    } catch (err) {
      console.warn("normalize assignment.kho:", err.message);
    }
  }
  return findWarehouseByName(official);
}

function getKhoNameVariants(kho) {
  const name = String(kho || "").trim();
  if (!name) return [];

  const official = normalizeKhoName(name);
  const variants = new Set([name, official]);

  for (const [short, off] of Object.entries(SHORT_TO_OFFICIAL)) {
    if (name === short || name === off || official === off) {
      variants.add(short);
      variants.add(off);
    }
  }

  for (const [from, to] of Object.entries(KHO_RENAMES)) {
    if (variants.has(from) || variants.has(to) || name === from || official === to) {
      variants.add(from);
      variants.add(to);
    }
  }

  return [...variants];
}

module.exports = {
  ensureWarehouses,
  findWarehouseByName,
  resolveWarehouseForAssignment,
  SHORT_TO_OFFICIAL,
  normalizeKhoName,
  getKhoNameVariants,
};
