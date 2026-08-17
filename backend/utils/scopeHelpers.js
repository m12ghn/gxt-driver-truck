// Phân quyền theo kho: user WAREHOUSE chỉ thấy/thao tác data đúng kho của mình.

function applyWarehouseScope(req, where = {}) {
  if (req.user?.quyen === "WAREHOUSE") {
    where.kho = req.user.kho || "__NO_KHO__";
  }

  return where;
}

function assertWarehouseAccess(req, assignmentKho) {
  if (req.user?.quyen !== "WAREHOUSE") return;

  if (!req.user.kho || req.user.kho !== assignmentKho) {
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
};
