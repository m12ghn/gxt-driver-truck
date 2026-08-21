const User = require("../models/User");
const { parseKhoList } = require("../utils/scopeHelpers");
const { ensureUserKhoColumn } = require("../utils/ensureUserKhoColumn");

function parseHeaderKho(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];
  try {
    return parseKhoList(decodeURIComponent(raw));
  } catch {
    return parseKhoList(raw);
  }
}

function isBrokenKhoName(name) {
  const text = String(name || "").trim();
  return !text || text.startsWith("[") || text.includes('["');
}

// Gắn req.user từ header (FE gửi sau khi login).
// SUPER_ADMIN không nằm trong bảng Users — nhận qua x-user-quyen.
async function attachUser(req, res, next) {
  try {
    const msnv = req.headers["x-user-msnv"];
    const quyen = req.headers["x-user-quyen"];

    if (quyen === "SUPER_ADMIN") {
      req.user = {
        id: 0,
        msnv: msnv || "SUPER_ADMIN",
        hoTen: "Super Admin",
        quyen: "SUPER_ADMIN",
        kho: null,
        khoList: [],
      };
      return next();
    }

    if (!msnv) {
      req.user = null;
      return next();
    }

    await ensureUserKhoColumn();

    const user = await User.findOne({ where: { msnv } });

    if (!user || user.trangThai === "Khóa") {
      req.user = null;
      return next();
    }

    const fromDb = parseKhoList(user.kho).filter((name) => !isBrokenKhoName(name));
    const fromHeader = parseHeaderKho(req.headers["x-user-kho"]).filter(
      (name) => !isBrokenKhoName(name)
    );
    const khoList = [...new Set([...fromDb, ...fromHeader])];

    req.user = {
      id: user.id,
      msnv: user.msnv,
      hoTen: user.hoTen,
      quyen: user.quyen,
      kho: khoList.length ? khoList : user.kho,
      khoList,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = attachUser;
