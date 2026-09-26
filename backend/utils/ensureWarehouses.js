const Warehouse = require("../models/Warehouse");
const sequelize = require("../database/database");
const { DEFAULT_WAREHOUSES } = require("../constants/warehouses");

const KHO_RENAMES = {
  "Kho Trung Chuyển Hồ Chí Minh 01": "Kho Giao Hàng Nặng - Hồ Chí Minh",
};

// Phân công dùng tên ngắn ("Tân Bình"), DB đã có kho GHN đầy đủ tên + GPS thật.
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

async function applyWarehouseRenames() {
  for (const [from, to] of Object.entries(KHO_RENAMES)) {
    const oldRow = await Warehouse.findOne({ where: { ten: from } });
    const newRow = await Warehouse.findOne({ where: { ten: to } });

    if (oldRow && !newRow) {
      await oldRow.update({ ten: to });
    } else if (oldRow && newRow) {
      await oldRow.destroy();
    }

    for (const table of ["Assignments", "Vehicles", "Drivers"]) {
      await sequelize.query(
        `UPDATE "${table}" SET kho = :to WHERE kho = :from`,
        { replacements: { from, to } }
      );
    }

    await sequelize.query(
      `UPDATE "Users" SET kho = REPLACE(kho, :from, :to) WHERE kho LIKE :like`,
      { replacements: { from, to, like: `%${from}%` } }
    );
  }
}

async function ensureWarehouses() {
  if (ensured) return;

  try {
    await applyWarehouseRenames();
  } catch (err) {
    console.warn("applyWarehouseRenames:", err.message);
  }

  const existingCount = await Warehouse.count();
  if (existingCount >= DEFAULT_WAREHOUSES.length) {
    ensured = true;
    return;
  }

  for (const item of DEFAULT_WAREHOUSES) {
    const officialName = SHORT_TO_OFFICIAL[item.ten];
    const official = officialName
      ? await Warehouse.findOne({ where: { ten: officialName } })
      : null;

    const coords = official
      ? {
          latitude: official.latitude,
          longitude: official.longitude,
          banKinh: official.banKinh,
        }
      : {
          latitude: item.latitude,
          longitude: item.longitude,
          banKinh: item.banKinh,
        };

    const [warehouse] = await Warehouse.findOrCreate({
      where: { ten: item.ten },
      defaults: { ten: item.ten, ...coords },
    });

    if (official) {
      await warehouse.update(coords);
    }
  }

  ensured = true;
}

async function findWarehouseByName(ten) {
  const name = String(ten || "").trim();
  if (!name) return null;

  const officialName =
    SHORT_TO_OFFICIAL[name] || KHO_RENAMES[name] || null;
  if (officialName) {
    const official = await Warehouse.findOne({ where: { ten: officialName } });
    if (official) return official;
  }

  const exact = await Warehouse.findOne({ where: { ten: name } });
  if (exact) return exact;

  const all = await Warehouse.findAll();
  const needle = name.toLowerCase();

  return (
    all.find((w) => String(w.ten || "").toLowerCase().includes(needle)) ||
    all.find((w) => String(w.ten || "").trim().toLowerCase() === needle) ||
    null
  );
}

function normalizeKhoName(kho) {
  const name = String(kho || "").trim();
  const renamed = KHO_RENAMES[name] || name;
  return SHORT_TO_OFFICIAL[renamed] || SHORT_TO_OFFICIAL[name] || renamed;
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
  SHORT_TO_OFFICIAL,
  normalizeKhoName,
  getKhoNameVariants,
};
