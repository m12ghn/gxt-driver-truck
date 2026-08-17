const User = require("../models/User");

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
      };
      return next();
    }

    if (!msnv) {
      req.user = null;
      return next();
    }

    const user = await User.findOne({ where: { msnv } });

    if (!user || user.trangThai === "Khóa") {
      req.user = null;
      return next();
    }

    req.user = {
      id: user.id,
      msnv: user.msnv,
      hoTen: user.hoTen,
      quyen: user.quyen,
      kho: user.kho || null,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = attachUser;
