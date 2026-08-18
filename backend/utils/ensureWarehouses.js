const Warehouse = require("../models/Warehouse");
const { DEFAULT_WAREHOUSES } = require("../constants/warehouses");

let ensured = false;

async function ensureWarehouses() {
  if (ensured) return;

  for (const item of DEFAULT_WAREHOUSES) {
    const [warehouse, created] = await Warehouse.findOrCreate({
      where: { ten: item.ten },
      defaults: item,
    });

    if (
      !created &&
      (warehouse.latitude == null ||
        warehouse.longitude == null ||
        Number(warehouse.latitude) === 0)
    ) {
      await warehouse.update(item);
    }
  }

  ensured = true;
}

async function findWarehouseByName(ten) {
  const name = String(ten || "").trim();
  if (!name) return null;

  const exact = await Warehouse.findOne({ where: { ten: name } });
  if (exact) return exact;

  const all = await Warehouse.findAll();
  const needle = name.toLowerCase();
  return (
    all.find((w) => String(w.ten || "").trim().toLowerCase() === needle) ||
    null
  );
}

module.exports = { ensureWarehouses, findWarehouseByName };
