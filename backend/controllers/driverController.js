const Driver = require("../models/Driver");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const sequelize = require("../database/database");
const { normalizeMsnv } = require("../utils/assignmentHelpers");

// ==========================
// DANH SÁCH TÀI XẾ
// ==========================
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.findAll({
      order: [["id", "DESC"]],
    });

    res.json({
      success: true,
      data: drivers,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==========================
// CHI TIẾT TÀI XẾ
// ==========================
exports.getDriver = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài xế.",
      });
    }

    res.json({
      success: true,
      data: driver,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==========================
// THÊM TÀI XẾ
// Tự tạo User DRIVER
// ==========================
exports.createDriver = async (req, res) => {

  const transaction = await sequelize.transaction();

  try {

    const {
      hoTen,
      bangLai,
      loaiBang,
      kho,
      trangThai,
    } = req.body;

    const msnv = normalizeMsnv(req.body.msnv);
    const soDienThoai = String(req.body.soDienThoai || "").trim();

    // ======================
    // Kiểm tra Driver
    // ======================

    const existedDriverMSNV = await Driver.findOne({
      where: {
        msnv,
      },
      transaction,
    });

    if (existedDriverMSNV) {

      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "MSNV đã tồn tại.",
      });

    }

    const existedDriverPhone = await Driver.findOne({
      where: {
        soDienThoai,
      },
      transaction,
    });

    if (existedDriverPhone) {

      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Số điện thoại đã tồn tại.",
      });

    }

    // ======================
    // Kiểm tra User
    // ======================

    const existedUserMSNV = await User.findOne({
      where: {
        msnv,
      },
      transaction,
    });

    if (existedUserMSNV) {

      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "MSNV đã tồn tại trong User.",
      });

    }

    const existedUserPhone = await User.findOne({
      where: {
        soDienThoai,
      },
      transaction,
    });

    if (existedUserPhone) {

      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Số điện thoại đã tồn tại trong User.",
      });

    }

    // ======================
    // Tạo Driver
    // ======================

    const driver = await Driver.create(
      {
        msnv,
        hoTen,
        soDienThoai,
        bangLai,
        loaiBang,
        kho,
        trangThai,
      },
      {
        transaction,
      }
    );

    // ======================
    // Tạo User
    // ======================

    await User.create(
      {
        msnv,
        hoTen,
        soDienThoai,

        // Tài khoản = MSNV
        // Mật khẩu = số điện thoại
        matKhau: soDienThoai,

        quyen: "DRIVER",

        trangThai:
          trangThai === "Đang làm"
            ? "Hoạt động"
            : "Khóa",
      },
      {
        transaction,
      }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Thêm tài xế thành công.",
      data: driver,
    });

  } catch (err) {

    await transaction.rollback();

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};

// ==========================
// CẬP NHẬT TÀI XẾ
// Đồng bộ User
// ==========================
exports.updateDriver = async (req, res) => {

  const transaction = await sequelize.transaction();

  try {

    const driver = await Driver.findByPk(req.params.id, { transaction });

    if (!driver) {

      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài xế.",
      });

    }

    // Lưu MSNV cũ để tìm User
    const oldMSNV = driver.msnv;

    const {
      msnv,
      hoTen,
      soDienThoai,
      bangLai,
      loaiBang,
      kho,
      trangThai,
    } = req.body;

    // ======================
    // Kiểm tra Driver
    // ======================

    const existedDriverMSNV = await Driver.findOne({
      where: { msnv },
      transaction,
    });

    if (
      existedDriverMSNV &&
      existedDriverMSNV.id !== driver.id
    ) {

      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "MSNV đã tồn tại.",
      });

    }

    const existedDriverPhone = await Driver.findOne({
      where: {
        soDienThoai,
      },
      transaction,
    });

    if (
      existedDriverPhone &&
      existedDriverPhone.id !== driver.id
    ) {

      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Số điện thoại đã tồn tại.",
      });

    }

    // ======================
    // Kiểm tra User
    // ======================

    const existedUserMSNV = await User.findOne({
      where: { msnv },
      transaction,
    });

    if (
      existedUserMSNV &&
      existedUserMSNV.msnv !== oldMSNV
    ) {

      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "MSNV đã tồn tại trong User.",
      });

    }

    const existedUserPhone = await User.findOne({
      where: {
        soDienThoai,
      },
      transaction,
    });

    if (
      existedUserPhone &&
      existedUserPhone.msnv !== oldMSNV
    ) {

      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Số điện thoại đã tồn tại trong User.",
      });

    }

    // ======================
    // Update Driver
    // ======================

    await driver.update(
      {
        msnv,
        hoTen,
        soDienThoai,
        bangLai,
        loaiBang,
        kho,
        trangThai,
      },
      {
        transaction,
      }
    );

    // ======================
    // Update User
    // ======================

    const user = await User.findOne({
      where: {
        msnv: oldMSNV,
        quyen: "DRIVER",
      },
      transaction,
    });

    if (user) {

      await user.update(
        {
          msnv,
          hoTen,
          soDienThoai,

          // Mật khẩu luôn = số điện thoại
          matKhau: soDienThoai,

          trangThai:
            trangThai === "Đang làm"
              ? "Hoạt động"
              : "Khóa",
        },
        {
          transaction,
        }
      );

    }

    await transaction.commit();

    res.json({
      success: true,
      message: "Cập nhật tài xế thành công.",
      data: driver,
    });

  } catch (err) {

    await transaction.rollback();

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};

// ==========================
// KHÓA / MỞ TÀI XẾ
// Đồng bộ User
// ==========================
exports.changeStatus = async (req, res) => {

  const transaction = await sequelize.transaction();

  try {

    const driver = await Driver.findByPk(req.params.id, { transaction });

    if (!driver) {

      await transaction.rollback();

      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài xế.",
      });

    }

    const newDriverStatus =
      driver.trangThai === "Đang làm"
        ? "Nghỉ việc"
        : "Đang làm";

    await driver.update(
      {
        trangThai: newDriverStatus,
      },
      {
        transaction,
      }
    );

    const user = await User.findOne({
      where: {
        msnv: driver.msnv,
        quyen: "DRIVER",
      },
      transaction,
    });

    if (user) {

      await user.update(
        {
          trangThai:
            newDriverStatus === "Đang làm"
              ? "Hoạt động"
              : "Khóa",
        },
        {
          transaction,
        }
      );

    }

    await transaction.commit();

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công.",
    });

  } catch (err) {

    await transaction.rollback();

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};

// ==========================
// XÓA TÀI XẾ
// Đồng bộ xóa User DRIVER tương ứng
// ==========================
exports.deleteDriver = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const driver = await Driver.findByPk(req.params.id, { transaction });

    if (!driver) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài xế.",
      });
    }

    const assignmentCount = await Assignment.count({
      where: { driverId: driver.id },
      transaction,
    });

    if (assignmentCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Không xóa được vì tài xế còn ${assignmentCount} phân công liên quan. Hãy khóa tài xế thay vì xóa.`,
      });
    }

    const user = await User.findOne({
      where: {
        msnv: driver.msnv,
        quyen: "DRIVER",
      },
      transaction,
    });

    if (user) {
      await user.destroy({ transaction });
    }

    await driver.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: "Đã xóa tài xế.",
    });
  } catch (err) {
    await transaction.rollback();

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};