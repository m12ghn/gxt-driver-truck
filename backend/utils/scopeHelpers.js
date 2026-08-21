const { Op } = require("sequelize");
const { getKhoNameVariants, normalizeKhoName } = require("./ensureWarehouses");

function parseKhoList(kho) {
  if (Array.isArray(kho)) {
    return [...new Set(kho.map((item) => String(item || "").trim()).filter(Boolean))];
  }

  const raw = String(kho || "").trim();
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parseKhoList(parsed);
    } catch {
      // keep falling through
    }
  }

  if (raw.includes("|")) {
    return parseKhoList(raw.split("|"));
  }

  return [raw];
}

function serializeKhoList(kho) {
  const list = [
    ...new Set(
      parseKhoList(kho)
        .map((name) => normalizeKhoName(name))
        .filter(Boolean)
    ),
  ];
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  return JSON.stringify(list);
}

function getUserKhoVariants(kho) {
  const variants = new Set();
  for (const name of parseKhoList(kho)) {
    for (const item of getKhoNameVariants(name)) {
      variants.add(item);
    }
  }
  return [...variants];
}

function warehouseKhoFilter(kho) {
  const variants = getUserKhoVariants(kho);
  if (!variants.length) return "__NO_KHO__";
  if (variants.length === 1) return variants[0];
  return { [Op.in]: variants };
}

function userKhoValue(user) {
  if (!user) return null;
  if (Array.isArray(user.khoList) && user.khoList.length) return user.khoList;
  return user.kho || null;
}

function applyWarehouseScope(req, where = {}) {
  if (req.user?.quyen === "WAREHOUSE") {
    where.kho = warehouseKhoFilter(userKhoValue(req.user));
  }

  return where;
}

function assertWarehouseAccess(req, assignmentKho) {
  if (req.user?.quyen !== "WAREHOUSE") return;

  const allowed = getUserKhoVariants(userKhoValue(req.user));
  const target = getKhoNameVariants(normalizeKhoName(assignmentKho));
  const ok = target.some((item) => allowed.includes(item));

  if (!parseKhoList(userKhoValue(req.user)).length || !ok) {
    const err = new Error("Bạn chỉ được thao tác dữ liệu kho của mình.");
    err.status = 403;
    throw err;
  }
}

function getScopedKho(req) {
  if (req.user?.quyen === "WAREHOUSE") {
    return userKhoValue(req.user);
  }

  return null;
}

function assertWarehouseKhoChoice(req, kho) {
  if (req.user?.quyen !== "WAREHOUSE") return normalizeKhoName(kho);

  const list = parseKhoList(userKhoValue(req.user));
  if (!list.length) {
    const err = new Error("Tài khoản kho chưa được gán kho phụ trách.");
    err.status = 403;
    throw err;
  }

  const chosen = normalizeKhoName(kho || list[0]);
  assertWarehouseAccess(req, chosen);
  return chosen;
}

module.exports = {
  parseKhoList,
  serializeKhoList,
  getUserKhoVariants,
  applyWarehouseScope,
  assertWarehouseAccess,
  assertWarehouseKhoChoice,
  getScopedKho,
  warehouseKhoFilter,
  userKhoValue,
};
