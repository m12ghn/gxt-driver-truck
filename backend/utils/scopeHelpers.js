const { Op } = require("sequelize");
const { getKhoNameVariants } = require("./ensureWarehouses");

// Phân quyền theo kho: user WAREHOUSE chỉ thấy/thao tác data đúng kho của mình.

function warehouseKhoFilter(kho) {
  const variants = getKhoNameVariants(kho);
  if (!variants.length) return "__NO_KHO__";
  if (variants.length === 1) return variants[0];
  return { [Op.in]: variants };
}

function applyWarehouseScope(req, where = {}) {
  if (req.user?.quyen === "WAREHOUSE") {
    where.kho = warehouseKhoFilter(req.user.kho);
  }

  return where;
}

function assertWarehouseAccess(req, assignmentKho) {
  if (req.user?.quyen !== "WAREHOUSE") return;

  const variants = getKhoNameVariants(req.user.kho);
  if (!req.user.kho || !variants.includes(assignmentKho)) {
    const err = new Error("Bạn chỉ được thao tác dữ liệu kho của mình.");
    err.status = 403;
    throw err;
  }
}

function getScopedKho(req) {
  if (req.user?.quyen === "WAREHOUSE") {
    return req.user.kho || null;
  }

  return null;
}

module.exports = {
  applyWarehouseScope,
  assertWarehouseAccess,
  getScopedKho,
  warehouseKhoFilter,
};
