const User = require("../models/User");
const { parseKhoList, serializeKhoList } = require("../utils/scopeHelpers");
const { ensureUserKhoColumn } = require("../utils/ensureUserKhoColumn");

function resolveWarehouseKho(quyen, kho) {
  if (quyen !== "WAREHOUSE") return null;
  return serializeKhoList(kho);
}

// ==========================
// DANH SÁCH USER
// ==========================
exports.getAll = async (req, res) => {
  try {
    const users = await User.findAll({
      order: [["id", "DESC"]],
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// THÊM USER
// Chỉ cho phép ADMIN và WAREHOUSE
// ==========================
exports.create = async (req, res) => {
  try {
    await ensureUserKhoColumn();
    const {
      msnv,
      hoTen,
      soDienThoai,
      quyen,
      kho,
    } = req.body;

    // Không cho tạo DRIVER từ màn User
    if (quyen === "DRIVER") {
      return res.status(400).json({
        success: false,
        message: "Tài khoản DRIVER phải được tạo từ màn Quản lý tài xế.",
      });
    }

    if (quyen === "WAREHOUSE" && !parseKhoList(kho).length) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ít nhất một kho phụ trách cho tài khoản WAREHOUSE.",
      });
    }

    // Kiểm tra MSNV
    const existedMSNV = await User.findOne({
      where: { msnv },
    });

    if (existedMSNV) {
      return res.status(400).json({
        success: false,
        message: "MSNV đã tồn tại.",
      });
    }

    // Kiểm tra SĐT
    const existedPhone = await User.findOne({
      where: { soDienThoai },
    });

    if (existedPhone) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại đã tồn tại.",
      });
    }

    const user = await User.create({
      msnv,
      hoTen,
      soDienThoai,

      // Mật khẩu mặc định = MSNV
      matKhau: msnv,

      quyen,
      kho: resolveWarehouseKho(quyen, kho),

      trangThai: "Hoạt động",
    });

    res.status(201).json({
      success: true,
      message: "Tạo User thành công.",
      data: user,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// CẬP NHẬT USER
// ==========================
exports.update = async (req, res) => {
  try {
    await ensureUserKhoColumn();
    const { id } = req.params;

    const {
      msnv,
      hoTen,
      soDienThoai,
      quyen,
      kho,
      trangThai,
    } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy User.",
      });
    }

    // Không cho đổi sang DRIVER
    if (quyen === "DRIVER") {
      return res.status(400).json({
        success: false,
        message: "Không thể đổi User thành DRIVER.",
      });
    }

    if (quyen === "WAREHOUSE" && !parseKhoList(kho).length) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ít nhất một kho phụ trách cho tài khoản WAREHOUSE.",
      });
    }

    // Kiểm tra MSNV trùng
    const existedMSNV = await User.findOne({
      where: { msnv },
    });

    if (existedMSNV && existedMSNV.id !== user.id) {
      return res.status(400).json({
        success: false,
        message: "MSNV đã tồn tại.",
      });
    }

    // Kiểm tra SĐP trùng
    const existedPhone = await User.findOne({
      where: { soDienThoai },
    });

    if (existedPhone && existedPhone.id !== user.id) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại đã tồn tại.",
      });
    }

    await user.update({
      msnv,
      hoTen,
      soDienThoai,

      // Luôn đồng bộ mật khẩu = MSNV
      matKhau: msnv,

      quyen,
      kho: resolveWarehouseKho(quyen, kho),
      trangThai,
    });

    res.json({
      success: true,
      message: "Cập nhật User thành công.",
      data: user,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// KHÓA / MỞ USER
// ==========================
exports.changeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy User.",
      });
    }

    const newStatus =
      user.trangThai === "Hoạt động"
        ? "Khóa"
        : "Hoạt động";

    await user.update({
      trangThai: newStatus,
    });

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công.",
      data: user,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};