const XLSX = require("xlsx");
const { Op } = require("sequelize");

const sequelize = require("../database/database");
const Assignment = require("../models/Assignment");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const User = require("../models/User");

const {
  markOverdueAssignments,
  findDriversByMsnv,
  normalizeMsnv,
  parseNgay,
} = require("../utils/assignmentHelpers");
const {
  uploadBufferToSupabase,
  createSignedUpload,
  createSignedUploads,
} = require("../utils/uploadToSupabase");
const { normalizeKhoName } = require("../utils/ensureWarehouses");

function cell(row, ...names) {
  const keys = Object.keys(row || {});

  for (const name of names) {
    if (row[name] != null && String(row[name]).trim() !== "") {
      return row[name];
    }

    const key = keys.find(
      (item) =>
        String(item).replace(/\u00a0/g, " ").trim().toLowerCase() ===
        name.toLowerCase()
    );

    if (key != null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }

  return "";
}

// ========================================
// IMPORT EXCEL
// ========================================
exports.importExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Chưa chọn file",
      });
    }

    await markOverdueAssignments();

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      raw: false,
      dateNF: "dd/mm/yyyy",
    });

    let success = 0;
    let errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const ngay = parseNgay(cell(row, "Ngày", "Ngay", "Date"));

      if (!ngay) {
        errors.push(`Dòng ${i + 2}: Ngày không hợp lệ.`);
        continue;
      }

      const bienSo = String(cell(row, "Biển số", "Bien so") || "").trim();
      const msnv = normalizeMsnv(cell(row, "MSNV", "Msnv"));
      const ca = String(cell(row, "Ca") || "").trim();
      const kho = normalizeKhoName(cell(row, "Kho"));

      const vehicle = await Vehicle.findOne({
        where: {
          [Op.or]: [
            { bienSo },
            sequelize.where(
              sequelize.fn("trim", sequelize.col("bienSo")),
              bienSo
            ),
          ],
        },
      });

      if (!vehicle) {
        errors.push(
          `Dòng ${i + 2}: Không tìm thấy xe ${bienSo || row["Biển số"]}`
        );
        continue;
      }

      let driver = (await findDriversByMsnv(msnv))[0];

      if (!driver && msnv) {
        const user = await User.findOne({
          where: {
            [Op.or]: [
              { msnv },
              sequelize.where(
                sequelize.fn("trim", sequelize.col("msnv")),
                msnv
              ),
            ],
          },
        });

        if (user && String(user.quyen || "").toUpperCase() === "DRIVER") {
          driver = await Driver.create({
            msnv: normalizeMsnv(user.msnv),
            hoTen: user.hoTen,
            soDienThoai: user.soDienThoai,
            kho: user.kho || kho,
            trangThai:
              user.trangThai === "Hoạt động" ? "Đang làm" : "Nghỉ việc",
          });
        } else if (user) {
          errors.push(
            `Dòng ${i + 2}: MSNV ${msnv} đang là tài khoản ${user.quyen}, chưa có hồ sơ tài xế.`
          );
          continue;
        }
      }

      if (!driver) {
        errors.push(
          `Dòng ${i + 2}: Không tìm thấy tài xế ${msnv || row["MSNV"]}`
        );
        continue;
      }

      // Trong cùng 1 ngày, 1 xe chỉ được phân công 1 lần
      // (không phân biệt Ca) - đồng bộ rule với createAssignment
      const existedVehicle = await Assignment.findOne({
        where: {
          ngay,
          vehicleId: vehicle.id,
        },
      });

      if (existedVehicle) {
        errors.push(
          `Dòng ${i + 2}: Xe ${row["Biển số"]} đã được phân công trong ngày này`
        );
        continue;
      }

      // Trong cùng 1 ngày, 1 tài xế chỉ được phân công 1 lần
      // (không phân biệt Ca) - đồng bộ rule với createAssignment
      const existedDriver = await Assignment.findOne({
        where: {
          ngay,
          driverId: driver.id,
        },
      });

      if (existedDriver) {
        errors.push(
          `Dòng ${i + 2}: Tài xế ${row["MSNV"]} đã được phân công trong ngày này`
        );
        continue;
      }

      await Assignment.create({
        ngay,
        ca,
        kho,
        vehicleId: vehicle.id,
        driverId: driver.id,
        trangThai: "Chưa thực hiện",
      });

      success++;
    }

    res.json({
      success: true,
      imported: success,
      errors,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ========================================
// UPLOAD ẢNH CHECK IN
// ========================================
exports.uploadCheckInImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Chưa chọn ảnh.",
      });
    }

    res.json({
      success: true,
      fileName: req.file.filename,
      filePath: `/uploads/checkin/${req.file.filename}`,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const ALLOWED_FOLDERS = ["checkin", "checkout", "incidents"];

exports.createSignedUpload = async (req, res) => {
  try {
    const folder = ALLOWED_FOLDERS.includes(req.body?.folder)
      ? req.body.folder
      : "checkin";

    const count = Math.min(8, Math.max(1, Number(req.body?.count) || 1));
    const files =
      count === 1
        ? [await createSignedUpload(folder)]
        : await createSignedUploads(folder, count);

    res.json({
      success: true,
      ...files[0],
      files,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.uploadDriverPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Chưa chọn ảnh.",
      });
    }

    const folder = ALLOWED_FOLDERS.includes(req.body?.folder)
      ? req.body.folder
      : "checkin";

    const url = await uploadBufferToSupabase(req.file, folder);

    res.json({
      success: true,
      url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};