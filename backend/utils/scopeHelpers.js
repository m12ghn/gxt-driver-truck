const { Op } = require("sequelize");
const {
  getKhoNameVariants,
  normalizeKhoName,
  SHORT_TO_OFFICIAL,
} = require("./ensureWarehouses");

const EXTRA_OFFICIAL_KHO = [
  "Kho Trung Chuyển Hồ Chí Minh 01",
  "Kho Trung Chuyển Hồ Chí Minh 20",
];

function knownKhoNames() {
  return [
    ...Object.keys(SHORT_TO_OFFICIAL),
    ...Object.values(SHORT_TO_OFFICIAL),
    ...EXTRA_OFFICIAL_KHO,
  ];
}

function recoverKhoNames(raw) {
  const text = String(raw || "");
  const found = [];

  for (const match of text.matchAll(/"([^"]+)"/g)) {
    const name = String(match[1] || "").trim();
    if (name.startsWith("Kho ") || SHORT_TO_OFFICIAL[name]) found.push(name);
  }

  const known = knownKhoNames().sort((a, b) => b.length - a.length);
  for (const name of known) {
    if (name && text.includes(name)) found.push(name);
  }

  return uniqueNames(found);
}

function uniqueNames(list) {
  return [
    ...new Set(
      (list || [])
        .map((item) => String(item || "").trim())
        .filter((name) => name && !name.startsWith("[") && name !== "__NO_KHO__")
    ),
  ];
}

function parseKhoList(kho) {
  if (Array.isArray(kho)) {
    const out = [];
    for (const item of kho) {
      if (item == null || item === "") continue;
      if (Array.isArray(item)) {
        out.push(...parseKhoList(item));
        continue;
      }
      const s = String(item).trim();
      if (!s) continue;
      if (s.startsWith("[") || s.startsWith("\"") || s.includes("|")) {
        out.push(...parseKhoList(s));
      } else {
        out.push(s);
      }
    }
    return uniqueNames(out);
  }

  const raw = String(kho || "").trim();
  if (!raw) return [];

  if (raw.startsWith("[") || raw.startsWith("\"")) {
    try {
      let parsed = JSON.parse(raw);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      if (Array.isArray(parsed)) return parseKhoList(parsed);
    } catch {
      const recovered = recoverKhoNames(raw);
      if (recovered.length) return recovered;
    }
  }

  if (raw.includes("|")) {
    return parseKhoList(raw.split("|"));
  }

  if (raw.startsWith("[")) return recoverKhoNames(raw);

  return uniqueNames([raw]);
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
  return list.join("|");
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
