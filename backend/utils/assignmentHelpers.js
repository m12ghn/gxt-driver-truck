const { Op } = require("sequelize");

const sequelize = require("../database/database");
const Assignment = require("../models/Assignment");
const Driver = require("../models/Driver");

function vietnamToday() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function assignmentDays() {
  const utcToday = new Date().toISOString().split("T")[0];
  return [...new Set([vietnamToday(), utcToday])];
}

function normalizeMsnv(value) {
  return String(value || "").trim();
}

async function findDriversByMsnv(msnv) {
  const trimmed = normalizeMsnv(msnv);
  if (!trimmed) return [];

  return Driver.findAll({
    where: {
      [Op.or]: [
        { msnv: trimmed },
        sequelize.where(sequelize.fn("trim", sequelize.col("msnv")), trimmed),
      ],
    },
  });
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
  assignmentDays,
  normalizeMsnv,
  findDriversByMsnv,
  markOverdueAssignments,
  findUnfinishedAssignment,
};
