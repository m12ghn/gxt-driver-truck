const XLSX = require("xlsx");

const Assignment = require("../models/Assignment");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

const {
  markOverdueAssignments,
} = require("../utils/assignmentHelpers");

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

      let ngay = String(row["Ngày"]).trim();

      if (ngay.includes("/")) {
        const [dd, mm, yyyy] = ngay.split("/");

        ngay = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      }

      const vehicle = await Vehicle.findOne({
        where: {
          bienSo: row["Biển số"],
        },
      });

      if (!vehicle) {
        errors.push(
          `Dòng ${i + 2}: Không tìm thấy xe ${row["Biển số"]}`
        );
        continue;
      }

      const driver = await Driver.findOne({
        where: {
          msnv: row["MSNV"],
        },
      });

      if (!driver) {
        errors.push(
          `Dòng ${i + 2}: Không tìm thấy tài xế ${row["MSNV"]}`
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
        ca: row["Ca"],
        kho: row["Kho"],
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