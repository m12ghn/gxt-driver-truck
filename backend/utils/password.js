const bcrypt = require("bcryptjs");

const isHashed = (value) => /^\$2[aby]\$/.test(String(value || ""));

function hashPassword(plain) {
  return bcrypt.hashSync(String(plain), 10);
}

// Hỗ trợ cả mật khẩu cũ (chữ thường) lẫn đã băm. needsUpgrade = true khi
// mật khẩu đúng nhưng vẫn đang lưu dạng chữ thường -> nên băm lại.
function verifyPassword(plain, stored) {
  const candidate = String(plain ?? "");
  const saved = String(stored ?? "");
  if (!saved) return { ok: false, needsUpgrade: false };

  if (isHashed(saved)) {
    return { ok: bcrypt.compareSync(candidate, saved), needsUpgrade: false };
  }

  return { ok: candidate === saved, needsUpgrade: candidate === saved };
}

module.exports = { hashPassword, verifyPassword, isHashed };
