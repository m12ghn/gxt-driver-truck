const sequelize = require("../database/database");
const User = require("../models/User");
const Driver = require("../models/Driver");
const { parseKhoList } = require("../utils/scopeHelpers");

function phoneVariants(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return [];

  const variants = new Set([digits]);

  if (digits.startsWith("84") && digits.length >= 11) {
    variants.add("0" + digits.slice(2));
    variants.add(digits.slice(2));
  }

  if (digits.startsWith("0") && digits.length >= 10) {
    variants.add("84" + digits.slice(1));
    variants.add(digits.slice(1));
  }

  if (!digits.startsWith("0") && !digits.startsWith("84") && digits.length === 9) {
    variants.add("0" + digits);
    variants.add("84" + digits);
  }

  return [...variants];
}

function phonesMatch(a, b) {
  const left = new Set(phoneVariants(a));
  return phoneVariants(b).some((item) => left.has(item));
}

function findByMsnv(Model, msnv) {
  return Model.findOne({ where: { msnv } }).then((row) => {
    if (row) return row;
    return Model.findOne({
      where: sequelize.where(sequelize.fn("trim", sequelize.col("msnv")), msnv),
    });
  });
}

// =====================================
// ADMIN LOGIN
// =====================================
exports.adminLogin = async (req, res) => {

  try {

    const { taiKhoan, matKhau } = req.body;

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
    plain.khoList = parseKhoList(plain.kho);

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

    const [driver, foundUser] = await Promise.all([
      findByMsnv(Driver, msnv),
      findByMsnv(User, msnv),
    ]);
    let user = foundUser;

    if (user && String(user.quyen || "").toUpperCase() !== "DRIVER") {
      if (driver) {
        user = null;
      } else {
        return res.status(401).json({
          success: false,
          message: "Sai MSNV hoặc mật khẩu.",
        });
      }
    }

    if (!user && !driver) {
      return res.status(401).json({
        success: false,
        message: "Sai MSNV hoặc mật khẩu.",
      });
    }

    const passwordOk = [driver?.soDienThoai, user?.soDienThoai].some((phone) =>
      phonesMatch(matKhau, phone)
    );

    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: "Sai MSNV hoặc mật khẩu.",
      });
    }

    const canonicalPhone = String(
      driver?.soDienThoai || user?.soDienThoai || matKhau
    ).trim();

    if (!user && driver) {
      try {
        user = await User.create({
          msnv: String(driver.msnv).trim(),
          hoTen: driver.hoTen,
          soDienThoai: canonicalPhone,
          matKhau: canonicalPhone,
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
          soDienThoai: canonicalPhone,
          quyen: "DRIVER",
          trangThai:
            driver.trangThai === "Đang làm" ? "Hoạt động" : "Khóa",
          toJSON() {
            return {
              id: this.id,
              msnv: this.msnv,
              hoTen: this.hoTen,
              soDienThoai: this.soDienThoai,
              quyen: this.quyen,
              trangThai: this.trangThai,
            };
          },
        };
      }
    }

    if (user.trangThai === "Khóa") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đang bị khóa. Vui lòng liên hệ Admin.",
      });
    }

    if (user.update) {
      const patch = {};
      if (String(user.matKhau || "").trim() !== canonicalPhone) {
        patch.matKhau = canonicalPhone;
      }
      if (String(user.soDienThoai || "").trim() !== canonicalPhone) {
        patch.soDienThoai = canonicalPhone;
      }
      if (Object.keys(patch).length > 0) {
        try {
          await user.update(patch);
        } catch (syncErr) {
          console.error("Sync driver password failed:", syncErr.message);
        }
      }
    }

    const plain = typeof user.toJSON === "function" ? user.toJSON() : { ...user };
    delete plain.matKhau;
    plain.khoList = parseKhoList(plain.kho);

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