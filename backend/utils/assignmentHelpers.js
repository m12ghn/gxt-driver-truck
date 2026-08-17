const { Op } = require("sequelize");

const Assignment = require("../models/Assignment");

// ==============================
// Tự động chuyển các chuyến đã Check In
// nhưng qua ngày vẫn chưa Check Out
// sang trạng thái "Chưa hoàn thành"
// ==============================
async function markOverdueAssignments() {

  const today = new Date()
    .toISOString()
    .split("T")[0];

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
  markOverdueAssignments,
  findUnfinishedAssignment,
};
