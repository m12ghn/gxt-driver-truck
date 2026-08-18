const XLSX = require("xlsx");

const sequelize = require("../database/database");

const Driver = require("../models/Driver");
const User = require("../models/User");

// ========================================
// IMPORT DRIVER EXCEL
// ========================================
exports.importExcel = async (req, res) => {

  const transaction = await sequelize.transaction();

  try {

    if (!req.file) {

      await transaction.rollback();

      return res.status(400).json({
        success: false,
        message: "Chưa chọn file.",
      });

    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

    const sheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const rows = XLSX.utils.sheet_to_json(
      sheet,
      {
        raw: false,
      }
    );

    let imported = 0;

    let errors = [];

    for (let i = 0; i < rows.length; i++) {

      const row = rows[i];

      const msnv =
        String(row["MSNV"] || "").trim();

      const hoTen =
        String(row["Họ tên"] || "").trim();

      const soDienThoai =
        String(row["Số điện thoại"] || "").trim();

      const bangLai =
        String(row["GPLX"] || "").trim();

      const loaiBang =
        String(row["Loại bằng"] || "").trim();

      const kho =
        String(row["Kho"] || "").trim();

      if (
        !msnv ||
        !hoTen ||
        !soDienThoai
      ) {

        errors.push(
          `Dòng ${i + 2}: Thiếu thông tin bắt buộc.`
        );

        continue;

      }

      // ======================
      // Kiểm tra Driver
      // ======================

      const existedDriverMSNV =
        await Driver.findOne({
          where: {
            msnv,
          },
        });

      if (existedDriverMSNV) {

        errors.push(
          `Dòng ${i + 2}: MSNV ${msnv} đã tồn tại.`
        );

        continue;

      }

      const existedDriverPhone =
        await Driver.findOne({
          where: {
            soDienThoai,
          },
        });

      if (existedDriverPhone) {

        errors.push(
          `Dòng ${i + 2}: SĐP ${soDienThoai} đã tồn tại.`
        );

        continue;

      }

      // ======================
      // Kiểm tra User
      // ======================

      const existedUserMSNV =
        await User.findOne({
          where: {
            msnv,
          },
        });

      if (existedUserMSNV) {

        errors.push(
          `Dòng ${i + 2}: User ${msnv} đã tồn tại.`
        );

        continue;

      }

      const existedUserPhone =
        await User.findOne({
          where: {
            soDienThoai,
          },
        });

      if (existedUserPhone) {

        errors.push(
          `Dòng ${i + 2}: User ${soDienThoai} đã tồn tại.`
        );

        continue;

      }      // ======================
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
          trangThai: "Đang làm",
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

          // Mật khẩu mặc định = số điện thoại
          matKhau: soDienThoai,

          quyen: "DRIVER",

          trangThai: "Hoạt động",
        },
        {
          transaction,
        }
      );

      imported++;

    }

    // ======================
    // Commit Transaction
    // ======================

    await transaction.commit();

    res.json({
      success: true,
      imported,
      errors,
    });

  } catch (err) {

    await transaction.rollback();

    console.error(err);    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};