const { Op } = require("sequelize");

const sequelize = require("../database/database");
const Assignment = require("../models/Assignment");
const Driver = require("../models/Driver");

function vietnamToday() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function addDays(isoDate, n) {
  const [year, month, day] = String(isoDate)
    .slice(0, 10)
    .split("-")
    .map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day + n));
  return date.toISOString().slice(0, 10);
}

function assignmentDateText(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
  }
  const text = String(value).trim();
  const iso = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  return parseNgay(text);
}

function parseNgay(value) {
  const raw = String(value ?? "")
    .replace(/\u00a0/g, " ")
    .trim();
  if (!raw || raw === "undefined" || raw === "null") return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slash = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (slash) {
    let [, dd, mm, yyyy] = slash;
    if (yyyy.length === 2) {
      yyyy = Number(yyyy) > 50 ? `19${yyyy}` : `20${yyyy}`;
    }
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  return raw;
}

function assignmentDays() {
  const today = vietnamToday();
  const utcToday = new Date().toISOString().split("T")[0];
  return [...new Set([today, utcToday, addDays(today, -1), addDays(today, 1)])];
}

function normalizeMsnv(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\.0+$/, "");
}

function driverMatchesMsnv(driver, msnv) {
  const trimmed = normalizeMsnv(msnv);
  const theirs = normalizeMsnv(driver?.msnv);
  if (!trimmed || !theirs) return false;
  if (theirs === trimmed) return true;
  const digits = trimmed.replace(/\D/g, "");
  return Boolean(digits) && theirs.replace(/\D/g, "") === digits;
}

async function findDriversByMsnv(msnv) {
  const trimmed = normalizeMsnv(msnv);
  if (!trimmed) return [];

  const digits = trimmed.replace(/\D/g, "");
  const or = [
    { msnv: trimmed },
    sequelize.where(sequelize.fn("trim", sequelize.col("msnv")), trimmed),
  ];

  if (digits) {
    or.push(
      sequelize.where(
        sequelize.fn(
          "regexp_replace",
          sequelize.fn("trim", sequelize.col("msnv")),
          "[^0-9]",
          "",
          "g"
        ),
        digits
      )
    );
  }

  try {
    const rows = await Driver.findAll({
      where: { [Op.or]: or },
    });
    if (rows.length) return rows;
  } catch (err) {
    console.error("findDriversByMsnv:", err.message);
  }

  const all = await Driver.findAll();
  return all.filter((driver) => driverMatchesMsnv(driver, trimmed));
}

// ==============================
// Tự động chuyển các chuyến đã Check In
// nhưng qua ngày vẫn chưa Check Out
// sang trạng thái "Chưa hoàn thành"
// ==============================
async function markOverdueAssignments() {

  const today = vietnamToday();

  await Assignment.update(
    {
      trangThai: "Chưa hoàn thành",
    },
    {
      where: {
        ngay: {
          [Op.lt]: today,
        },
        checkInTime: {
          [Op.ne]: null,
        },
        checkOutTime: null,
        trangThai: {
          [Op.ne]: "Chưa hoàn thành",
        },
      },
    }
  );

}

// ==============================
// Kiểm tra xe/tài xế còn chuyến "Chưa hoàn thành"
// (đã Check In nhưng chưa Check Out, qua ngày)
// Nếu còn thì phải Check Out hộ chuyến cũ
// trước khi được phân công chuyến mới
// ==============================
async function findUnfinishedAssignment({
  vehicleId,
  driverId,
  excludeId,
}) {

  const where = {
    trangThai: "Chưa hoàn thành",
  };

  if (excludeId) {
    where.id = {
      [Op.ne]: excludeId,
    };
  }

  if (vehicleId) {

    const vehicleUnfinished = await Assignment.findOne({
      where: {
        ...where,
        vehicleId,
      },
    });

    if (vehicleUnfinished) {
      return {
        type: "vehicle",
        assignment: vehicleUnfinished,
      };
    }

  }

  if (driverId) {

    const driverUnfinished = await Assignment.findOne({
      where: {
        ...where,
        driverId,
      },
    });

    if (driverUnfinished) {
      return {
        type: "driver",
        assignment: driverUnfinished,
      };
    }

  }

  return null;

}

module.exports = {
  vietnamToday,
  addDays,
  assignmentDateText,
  parseNgay,
  assignmentDays,
  normalizeMsnv,
  driverMatchesMsnv,
  findDriversByMsnv,
  markOverdueAssignments,
  findUnfinishedAssignment,
};
