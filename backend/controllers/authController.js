const { Op } = require("sequelize");

const User = require("../models/User");
const Driver = require("../models/Driver");

// =====================================
// ADMIN LOGIN
// =====================================
exports.adminLogin = async (req, res) => {

  try {

    const { taiKhoan, matKhau } = req.body;

    // TEMP DEBUG — reveals only lengths/booleans, never actual values.
    // Remove this block once the SUPER_ADMIN login mismatch is solved.
    console.log("DEBUG adminLogin:", {
      inputUserLen: taiKhoan?.length,
      inputPassLen: matKhau?.length,
      envUserSet: process.env.SUPER_ADMIN_USER !== undefined,
      envUserLen: process.env.SUPER_ADMIN_USER?.length,
      envPassSet: process.env.SUPER_ADMIN_PASS !== undefined,
      envPassLen: process.env.SUPER_ADMIN_PASS?.length,
      userMatches: taiKhoan === process.env.SUPER_ADMIN_USER,
      passMatches: matKhau === process.env.SUPER_ADMIN_PASS,
    });

    // ==========================
    // SUPER ADMIN
    // ==========================
    if (
      taiKhoan === process.env.SUPER_ADMIN_USER &&
      matKhau === process.env.SUPER_ADMIN_PASS
    ) {

      return res.json({
        success: true,
        data: {
          id: 0,
          hoTen: "Super Admin",
          quyen: "SUPER_ADMIN",
        },
      });

    }

    // ==========================
    // ADMIN / WAREHOUSE
    // ==========================
    const user = await User.findOne({
      where: {
        msnv: taiKhoan,
        matKhau,
      },
    });

    if (!user) {

      return res.status(401).json({
        success: false,
        message: "Sai tài khoản hoặc mật khẩu.",
      });

    }

    const plain = user.toJSON();
    delete plain.matKhau;

    return res.json({
      success: true,
      data: plain,
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};

// =====================================
// DRIVER LOGIN
// =====================================
exports.driverLogin = async (req, res) => {
  try {
    const msnv = String(req.body.msnv || "").trim();
    const matKhau = String(req.body.matKhau || "").trim();

    if (!msnv || !matKhau) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập MSNV và mật khẩu.",
      });
    }

    let user = await User.findOne({
      where: {
        msnv,
        quyen: "DRIVER",
      },
    });

    if (!user) {
      const driver = await Driver.findOne({ where: { msnv } });
      const phone = String(driver?.soDienThoai || "").trim();

      if (driver && matKhau === phone) {
        try {
          user = await User.create({
            msnv: driver.msnv,
            hoTen: driver.hoTen,
            soDienThoai: driver.soDienThoai,
            matKhau: phone,
            quyen: "DRIVER",
            trangThai:
              driver.trangThai === "Đang làm" ? "Hoạt động" : "Khóa",
          });
        } catch (createErr) {
          console.error("Auto-create driver user failed:", createErr.message);
          user = {
            id: driver.id,
            msnv: driver.msnv,
            hoTen: driver.hoTen,
            soDienThoai: driver.soDienThoai,
            matKhau: phone,
            quyen: "DRIVER",
            trangThai:
              driver.trangThai === "Đang làm" ? "Hoạt động" : "Khóa",
            toJSON() {
              const copy = { ...this };
              return copy;
            },
          };
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Sai MSNV hoặc mật khẩu.",
      });
    }

    const phone = String(user.soDienThoai || "").trim();

    if (matKhau !== phone) {
      return res.status(401).json({
        success: false,
        message: "Sai MSNV hoặc mật khẩu.",
      });
    }

    if (user.trangThai === "Khóa") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đang bị khóa. Vui lòng liên hệ Admin.",
      });
    }

    if (user.update && String(user.matKhau || "").trim() !== phone) {
      await user.update({ matKhau: phone });
    }

    const plain = typeof user.toJSON === "function" ? user.toJSON() : { ...user };
    delete plain.matKhau;

    return res.json({
      success: true,
      data: plain,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};