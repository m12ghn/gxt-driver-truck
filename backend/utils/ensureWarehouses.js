const Warehouse = require("../models/Warehouse");
const { DEFAULT_WAREHOUSES } = require("../constants/warehouses");

// Phân công dùng tên ngắn ("Tân Bình"), DB đã có kho GHN đầy đủ tên + GPS thật.
const SHORT_TO_OFFICIAL = {
  "Tân Bình": "Kho Giao Hàng Nặng - Tân Bình - HCM",
  "Tân Tạo": "Kho Giao Hàng Nặng - Tân Tạo - HCM",
  "Tân Thuận": "Kho Giao Hàng Nặng - Tân Thuận - HCM",
  "Thủ Đức": "Kho Giao Hàng Nặng - Thủ Đức - HCM",
  "Nhà Bè": "Kho Giao Hàng Nặng - Nhà Bè - HCM",
  "Sóng Thần": "Kho Chuyển Tiếp Sóng Thần-Bình Dương",
  "Xuyên Á": "Kho Trung Chuyển Hồ Chí Minh 01",
};

let ensured = false;

async function ensureWarehouses() {
  if (ensured) return;

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

  const officialName = SHORT_TO_OFFICIAL[name];
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

module.exports = { ensureWarehouses, findWarehouseByName, SHORT_TO_OFFICIAL };
