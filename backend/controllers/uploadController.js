const XLSX = require("xlsx");
const { Op } = require("sequelize");

const Assignment = require("../models/Assignment");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const User = require("../models/User");

const {
  normalizeMsnv,
  driverMatchesMsnv,
  parseNgay,
  assignmentDateText,
} = require("../utils/assignmentHelpers");
const {
  uploadBufferToSupabase,
  createSignedUpload,
  createSignedUploads,
} = require("../utils/uploadToSupabase");
const { normalizeKhoName } = require("../utils/ensureWarehouses");
const { assertWarehouseAccess } = require("../utils/scopeHelpers");

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

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      raw: false,
      dateNF: "dd/mm/yyyy",
    });

    const vehicles = await Vehicle.findAll({
      attributes: ["id", "bienSo"],
    });
    const drivers = await Driver.findAll({
      attributes: ["id", "msnv", "hoTen", "soDienThoai", "kho", "trangThai"],
    });
    const driverUsers = await User.findAll({
      attributes: ["msnv", "hoTen", "soDienThoai", "kho", "trangThai", "quyen"],
    });

    const vehicleByPlate = new Map();
    for (const item of vehicles) {
      const plate = String(item.bienSo || "")
        .replace(/\u00a0/g, " ")
        .trim()
        .toLowerCase();
      if (plate) vehicleByPlate.set(plate, item);
    }

    function findDriver(msnv) {
      return drivers.find((item) => driverMatchesMsnv(item, msnv));
    }

    const dates = [];
    for (const row of rows) {
      const ngay = parseNgay(cell(row, "Ngày", "Ngay", "Date"));
      if (ngay) dates.push(ngay);
    }

    const existing = dates.length
      ? await Assignment.findAll({
          where: { ngay: { [Op.in]: [...new Set(dates)] } },
          attributes: ["ngay", "vehicleId", "driverId"],
        })
      : [];

    const takenVehicle = new Set(
      existing.map(
        (item) => `${assignmentDateText(item.ngay)}|${item.vehicleId}`
      )
    );
    const takenDriver = new Set(
      existing.map(
        (item) => `${assignmentDateText(item.ngay)}|${item.driverId}`
      )
    );

    let success = 0;
    let errors = [];
    const toCreate = [];

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

      try {
        assertWarehouseAccess(req, kho);
      } catch (scopeErr) {
        errors.push(`Dòng ${i + 2}: ${scopeErr.message}`);
        continue;
      }

      const plateKey = bienSo.replace(/\u00a0/g, " ").trim().toLowerCase();
      const vehicle = vehicleByPlate.get(plateKey);

      if (!vehicle) {
        errors.push(
          `Dòng ${i + 2}: Không tìm thấy xe ${bienSo || row["Biển số"]}`
        );
        continue;
      }

      let driver = findDriver(msnv);

      if (!driver && msnv) {
        const user = driverUsers.find(
          (item) =>
            driverMatchesMsnv({ msnv: item.msnv }, msnv) &&
            String(item.quyen || "").toUpperCase() === "DRIVER"
        );

        if (user) {
          driver = await Driver.create({
            msnv: normalizeMsnv(user.msnv),
            hoTen: user.hoTen,
            soDienThoai: user.soDienThoai,
            kho: user.kho || kho,
            trangThai:
              user.trangThai === "Hoạt động" ? "Đang làm" : "Nghỉ việc",
          });
          drivers.push(driver);
        } else {
          const otherUser = driverUsers.find((item) =>
            driverMatchesMsnv({ msnv: item.msnv }, msnv)
          );
          if (otherUser) {
            errors.push(
              `Dòng ${i + 2}: MSNV ${msnv} đang là tài khoản ${otherUser.quyen}, chưa có hồ sơ tài xế.`
            );
            continue;
          }
        }
      }

      if (!driver) {
        errors.push(
          `Dòng ${i + 2}: Không tìm thấy tài xế ${msnv || row["MSNV"]}`
        );
        continue;
      }

      const dayKey = assignmentDateText(ngay);
      const vehicleKey = `${dayKey}|${vehicle.id}`;
      const driverKey = `${dayKey}|${driver.id}`;

      if (takenVehicle.has(vehicleKey)) {
        errors.push(
          `Dòng ${i + 2}: Xe ${row["Biển số"]} đã được phân công trong ngày này`
        );
        continue;
      }

      if (takenDriver.has(driverKey)) {
        errors.push(
          `Dòng ${i + 2}: Tài xế ${row["MSNV"]} đã được phân công trong ngày này`
        );
        continue;
      }

      takenVehicle.add(vehicleKey);
      takenDriver.add(driverKey);

      toCreate.push({
        ngay,
        ca,
        kho,
        vehicleId: vehicle.id,
        driverId: driver.id,
        trangThai: "Chưa thực hiện",
      });

      success++;
    }

    if (toCreate.length) {
      await Assignment.bulkCreate(toCreate);
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