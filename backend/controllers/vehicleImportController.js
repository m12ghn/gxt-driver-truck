const XLSX = require("xlsx");

const Vehicle = require("../models/Vehicle");
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

function normalizeBienSo(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

function normalizeLoaiXe(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const map = {
    van: "Van",
    "1t9": "1T9",
    "1.9": "1T9",
    "5t": "5T",
    "8t": "8T",
    "15t": "15T",
  };

  return map[raw.toLowerCase()] || raw;
}

function normalizeStatus(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Hoạt động";

  const map = {
    "hoat dong": "Hoạt động",
    "hoạt động": "Hoạt động",
    "bao duong": "Bảo dưỡng",
    "bảo dưỡng": "Bảo dưỡng",
    ngung: "Ngưng",
    ngưng: "Ngưng",
  };

  return map[raw.toLowerCase()] || raw;
}

exports.downloadTemplate = (req, res) => {
  const rows = [
    {
      "Biển số": "50H-12345",
      "Loại xe": "1T9",
      "Kho": "Tân Bình",
      "Km hiện tại": 0,
      "Trạng thái": "Hoạt động",
      "Ghi chú": "",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Xe");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  res.setHeader(
    "Content-Disposition",
    'attachment; filename="mau-danh-sach-xe.xlsx"'
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
};

exports.importExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Chưa chọn file.",
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { raw: false });

    let created = 0;
    let updated = 0;
    const errors = [];

    const existing = await Vehicle.findAll();
    const byPlate = new Map();
    for (const vehicle of existing) {
      byPlate.set(normalizeBienSo(vehicle.bienSo), vehicle);
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const bienSo = normalizeBienSo(cell(row, "Biển số", "Bien so", "BSX"));
      const loaiXe = normalizeLoaiXe(cell(row, "Loại xe", "Loai xe"));
      const kho = normalizeKhoName(cell(row, "Kho"));
      const ghiChu = String(cell(row, "Ghi chú", "Ghi chu") || "").trim();
      const trangThai = normalizeStatus(cell(row, "Trạng thái", "Trang thai"));
      const kmRaw = cell(row, "Km hiện tại", "KM hiện tại", "Km");
      const kmHienTai = Number(String(kmRaw).replace(/[^\d.-]/g, "")) || 0;

      if (!bienSo || !loaiXe || !kho) {
        errors.push(
          `Dòng ${i + 2}: Thiếu biển số, loại xe hoặc kho.`
        );
        continue;
      }

      try {
        const existed = byPlate.get(bienSo);

        if (existed) {
          await existed.update({
            bienSo,
            loaiXe,
            kho,
            trangThai,
            ghiChu: ghiChu || existed.ghiChu,
            kmHienTai: kmRaw ? kmHienTai : existed.kmHienTai,
          });
          byPlate.set(bienSo, existed);
          updated++;
          continue;
        }

        const vehicle = await Vehicle.create({
          bienSo,
          loaiXe,
          kho,
          trangThai,
          ghiChu,
          kmHienTai,
        });
        byPlate.set(bienSo, vehicle);
        created++;
      } catch (err) {
        errors.push(`Dòng ${i + 2} (${bienSo}): ${err.message}`);
      }
    }

    res.json({
      success: true,
      imported: created + updated,
      created,
      updated,
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
