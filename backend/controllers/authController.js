const User = require("../models/User");

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

    const { msnv, matKhau } = req.body;

    const user = await User.findOne({
      where: {
        msnv,
        matKhau,
        quyen: "DRIVER",
      },
    });

    if (!user) {

      return res.status(401).json({
        success: false,
        message: "Sai MSNV hoặc mật khẩu.",
      });

    }

    return res.json({
      success: true,
      data: user,
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};