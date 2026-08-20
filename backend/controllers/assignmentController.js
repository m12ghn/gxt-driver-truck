const { Op } = require("sequelize");
const XLSX = require("xlsx");

const Assignment = require("../models/Assignment");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const IncidentReport = require("../models/IncidentReport");

const {
  vietnamToday,
  assignmentDays,
  findDriversByMsnv,
  markOverdueAssignments,
  findUnfinishedAssignment,
} = require("../utils/assignmentHelpers");

const {
  applyWarehouseScope,
  assertWarehouseAccess,
} = require("../utils/scopeHelpers");
const { syncVehicleKmFromOdo } = require("../utils/syncVehicleKm");
const { normalizeKhoName } = require("../utils/ensureWarehouses");
const {
  withReadablePhotos,
  withReadablePhotosList,
} = require("../utils/uploadToSupabase");

function denyIfOutOfScope(req, res, assignment) {
  try {
    assertWarehouseAccess(req, assignment.kho);
    return false;
  } catch (scopeErr) {
    res.status(scopeErr.status || 403).json({
      success: false,
      message: scopeErr.message,
    });
    return true;
  }
}

// ==============================
// Driver - Lấy phân công hôm nay theo MSNV
// ==============================
exports.getTodayAssignment = async (req, res) => {
  try {

    await markOverdueAssignments();

    const { msnv } = req.params;
    const days = assignmentDays();

    const drivers = await findDriversByMsnv(msnv);

    if (!drivers.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài xế.",
      });
    }

    const assignment = await Assignment.findOne({
      where: {
        ngay: { [Op.in]: days },
        driverId: { [Op.in]: drivers.map((item) => item.id) },
      },
      include: [
        Vehicle,
        Driver,
        { model: IncidentReport, as: "incidents" },
      ],
      order: [
        ["ngay", "DESC"],
        ["ca", "ASC"],
      ],
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Hôm nay chưa có phân công.",
      });
    }

    res.json({
      success: true,
      data: await withReadablePhotos(assignment),
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

// ==============================
// Admin - Danh sách phân công hôm nay
// ==============================
exports.getTodayAssignments = async (req, res) => {
  try {

    await markOverdueAssignments();

    const today = vietnamToday();

    const where = applyWarehouseScope(req, { ngay: today });

    const assignments = await Assignment.findAll({
      where,
      include: [Vehicle, Driver],
      order: [
        ["ca", "ASC"],
        ["kho", "ASC"],
      ],
    });

    res.json({
      success: true,
      data: await withReadablePhotosList(assignments),
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

// ==============================
// Danh sách phân công
// Hỗ trợ xem theo 1 ngày (ngay) hoặc khoảng ngày (from - to)
// Mặc định (không truyền gì) = hôm nay
// ==============================
exports.getAssignments = async (req, res) => {
  try {

    await markOverdueAssignments();

    const today = vietnamToday();

    let { ngay, from, to } = req.query;

    if (ngay) {
      from = ngay;
      to = ngay;
    }

    if (!from) from = today;
    if (!to) to = from;

    const where = applyWarehouseScope(req, {
      ngay: {
        [Op.between]: [from, to],
      },
    });

    const assignments = await Assignment.findAll({
      where,
      include: [
        Vehicle,
        Driver,
        { model: IncidentReport, as: "incidents" },
      ],
      order: [
        ["ngay", "ASC"],
        ["ca", "ASC"],
        ["kho", "ASC"],
      ],
    });

    res.json({
      success: true,
      data: await withReadablePhotosList(assignments),
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

// ==============================
// Xuất Excel danh sách phân công theo khoảng ngày
// ==============================
exports.exportExcel = async (req, res) => {
  try {

    await markOverdueAssignments();

    const today = vietnamToday();

    let { from, to } = req.query;

    if (!from) from = today;
    if (!to) to = from;

    const where = applyWarehouseScope(req, {
      ngay: {
        [Op.between]: [from, to],
      },
    });

    const assignments = await Assignment.findAll({
      where,
      include: [Vehicle, Driver],
      order: [
        ["ngay", "ASC"],
        ["ca", "ASC"],
        ["kho", "ASC"],
      ],
    });

    function formatDateTime(date) {
      if (!date) return "";
      return new Date(date).toLocaleString("vi-VN");
    }

    const rows = assignments.map((item) => ({
      "Ngày": item.ngay,
      "Ca": item.ca,
      "Kho": item.kho,
      "Biển số": item.Vehicle?.bienSo || "",
      "MSNV": item.Driver?.msnv || "",
      "Họ tên": item.Driver?.hoTen || "",
      "SĐT": item.Driver?.soDienThoai || "",
      "Check In - Thời gian": item.checkInTime
        ? formatDateTime(item.checkInTime)
        : "",
      "Check In - ODO": item.odoCheckIn ?? "",
      "Check Out - Thời gian": item.checkOutTime
        ? formatDateTime(item.checkOutTime)
        : "",
      "Check Out - ODO": item.odoCheckOut ?? "",
      "User xác nhận": item.warehouseConfirmBy || "",
      "Mã chuyến đi": item.maChuyenDi || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "PhanCong"
    );

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="phan-cong-${from}_${to}.xlsx"`
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

// ==============================
// Thêm phân công
// ==============================
exports.createAssignment = async (req, res) => {
  try {

    await markOverdueAssignments();

    let {
      ngay,
      ca,
      kho,
      vehicleId,
      driverId,
    } = req.body;

    if (req.user?.quyen === "WAREHOUSE") {
      if (!req.user.kho) {
        return res.status(403).json({
          success: false,
          message: "Tài khoản kho chưa được gán kho phụ trách.",
        });
      }
      kho = req.user.kho;
    }

    kho = normalizeKhoName(kho);

    // ==============================
    // Chặn trùng xe
    // Trong cùng 1 ngày, 1 xe chỉ được phân công 1 lần
    // (không phân biệt Ca)
    // ==============================
    const vehicleExists = await Assignment.findOne({
      where: {
        ngay,
        vehicleId,
      },
    });

    console.log("Vehicle Exists:", vehicleExists);

    if (vehicleExists) {
      return res.status(400).json({
        success: false,
        message: "Xe đã được phân công trong ngày này.",
      });
    }

    // ==============================
    // Chặn trùng tài xế
    // Trong cùng 1 ngày, 1 tài xế chỉ được phân công 1 lần
    // (không phân biệt Ca)
    // ==============================
    const driverExists = await Assignment.findOne({
      where: {
        ngay,
        driverId,
      },
    });

    console.log("Driver Exists:", driverExists);

    if (driverExists) {
      return res.status(400).json({
        success: false,
        message: "Tài xế đã được phân công trong ngày này.",
      });
    }

    const assignment = await Assignment.create({
      ngay,
      ca,
      kho,
      vehicleId,
      driverId,
      trangThai: "Chưa thực hiện",
    });

    res.status(201).json({
      success: true,
      data: assignment,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

// ==============================
// CHECK IN
// ==============================
exports.checkIn = async (req, res) => {
  try {

    await markOverdueAssignments();

    const assignment = await Assignment.findByPk(
      req.params.id
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phân công.",
      });
    }

    if (denyIfOutOfScope(req, res, assignment)) return;

    if (assignment.checkInTime) {
      return res.status(400).json({
        success: false,
        message: "Chuyến này đã Check In.",
      });
    }

    // ==============================
    // Chặn Check In nếu xe/tài xế còn chuyến
    // "Chưa hoàn thành" (chuyến cũ đã Check In nhưng
    // qua ngày vẫn chưa Check Out) - cần Admin Check Out hộ
    // để hoàn thành chuyến cũ trước
    // ==============================
    const unfinished = await findUnfinishedAssignment({
      vehicleId: assignment.vehicleId,
      driverId: assignment.driverId,
      excludeId: assignment.id,
    });

    if (unfinished) {

      const label =
        unfinished.type === "vehicle" ? "Xe" : "Tài xế";

      return res.status(400).json({
        success: false,
        message: `Chưa Check In được vì ${label.toLowerCase()} còn chuyến ngày ${unfinished.assignment.ngay} chưa hoàn thành. Cần Admin xác nhận hoàn thành (Check Out hộ) chuyến cũ trước.`,
      });

    }

    const {
      odoCheckIn,
      checkInLatitude,
      checkInLongitude,
    } = req.body;

    await assignment.update({
      trangThai: "Đã Check In",
      checkInTime: new Date(),
      odoCheckIn,
      checkInLatitude,
      checkInLongitude,
    });

    await syncVehicleKmFromOdo(assignment.vehicleId, odoCheckIn).catch((err) =>
      console.error("syncVehicleKmFromOdo:", err.message)
    );

    res.json({
      success: true,
      message: "Check In thành công.",
      data: assignment,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

// ==============================
// CHECK OUT
// ==============================
exports.checkOut = async (req, res) => {
  try {

    const assignment = await Assignment.findByPk(
      req.params.id
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phân công.",
      });
    }

    if (denyIfOutOfScope(req, res, assignment)) return;

    if (!assignment.checkInTime) {
      return res.status(400).json({
        success: false,
        message: "Chuyến này chưa Check In.",
      });
    }

    if (assignment.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: "Chuyến này đã Check Out.",
      });
    }

    const {
      odoCheckOut,
      checkOutLatitude,
      checkOutLongitude,
    } = req.body;

    await assignment.update({
      trangThai: "Hoàn thành",
      checkOutTime: new Date(),
      odoCheckOut,
      checkOutLatitude,
      checkOutLongitude,
      warehouseStatus: "Chờ xác nhận",
    });

    await syncVehicleKmFromOdo(assignment.vehicleId, odoCheckOut).catch((err) =>
      console.error("syncVehicleKmFromOdo:", err.message)
    );

    res.json({
      success: true,
      message: "Check Out thành công.",
      data: assignment,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

// ==============================
// ADMIN CHECK OUT HỘ
// Dùng khi tài xế quên Check Out
// ==============================
exports.adminCheckOut = async (req, res) => {
  try {

    const assignment = await Assignment.findByPk(
      req.params.id
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phân công.",
      });
    }

    if (denyIfOutOfScope(req, res, assignment)) return;

    if (!assignment.checkInTime) {
      return res.status(400).json({
        success: false,
        message: "Chuyến này chưa Check In.",
      });
    }

    if (assignment.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: "Chuyến này đã Check Out.",
      });
    }

    const {
      odoCheckOut,
      checkOutLatitude,
      checkOutLongitude,
      checkOutBy,
      adminCheckoutReason,
    } = req.body;

    if (!checkOutBy || !adminCheckoutReason) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập người thực hiện và lý do Check Out hộ.",
      });
    }

    await assignment.update({
      trangThai: "Hoàn thành",
      checkOutTime: new Date(),
      odoCheckOut,
      checkOutLatitude,
      checkOutLongitude,
      checkOutBy,
      adminCheckoutReason,
      warehouseStatus: "Chờ xác nhận",
    });

    await syncVehicleKmFromOdo(assignment.vehicleId, odoCheckOut).catch((err) =>
      console.error("syncVehicleKmFromOdo:", err.message)
    );

    res.json({
      success: true,
      message: "Admin Check Out hộ thành công.",
      data: assignment,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

// ==============================
// KHO XÁC NHẬN
// Chỉ được xác nhận sau khi đã Check Out
// ==============================
exports.confirmWarehouse = async (req, res) => {
  try {

    const assignment = await Assignment.findByPk(
      req.params.id
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phân công.",
      });
    }

    if (denyIfOutOfScope(req, res, assignment)) return;

    if (!assignment.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: "Chuyến này chưa Check Out, kho chưa thể xác nhận.",
      });
    }

    const {
      action, // "confirm" | "reject"
      warehouseConfirmBy,
      warehouseReason,
      maChuyenDi,
    } = req.body;

    if (!warehouseConfirmBy) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập người xác nhận.",
      });
    }

    if (action === "confirm") {

      const tripCode = String(maChuyenDi || "").trim();

      if (!tripCode) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập mã chuyến đi trước khi xác nhận.",
        });
      }

      await assignment.update({
        warehouseStatus: "Đã xác nhận",
        warehouseReason: null,
        warehouseConfirmBy,
        warehouseConfirmTime: new Date(),
        maChuyenDi: tripCode,
      });

      return res.json({
        success: true,
        message: "Kho xác nhận thành công.",
        data: assignment,
      });

    }

    if (action === "reject") {

      if (!warehouseReason) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập lý do không xác nhận.",
        });
      }

      // Chuyến vẫn giữ trangThai "Hoàn thành" vì đã Check In + Check Out,
      // chỉ kho không đồng ý về chất lượng/sai lệch, tách biệt qua warehouseStatus
      await assignment.update({
        warehouseStatus: "Không xác nhận",
        warehouseReason,
        warehouseConfirmBy,
        warehouseConfirmTime: new Date(),
      });

      return res.json({
        success: true,
        message: "Đã ghi nhận từ chối xác nhận.",
        data: assignment,
      });

    }

    return res.status(400).json({
      success: false,
      message: "Hành động không hợp lệ.",
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

// ==============================
// Cập nhật phân công
// ==============================
exports.updateAssignment = async (req, res) => {
  try {

    await markOverdueAssignments();

    const assignment = await Assignment.findByPk(
      req.params.id
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phân công",
      });
    }

    if (denyIfOutOfScope(req, res, assignment)) return;

    const ngay = req.body.ngay || assignment.ngay;
    const vehicleId = req.body.vehicleId || assignment.vehicleId;
    const driverId = req.body.driverId || assignment.driverId;

    // WAREHOUSE không được đổi sang kho khác
    if (req.user?.quyen === "WAREHOUSE" && req.body.kho) {
      req.body.kho = req.user.kho;
    }

    // ==============================
    // Chặn trùng xe
    // Trong cùng 1 ngày, 1 xe chỉ được phân công 1 lần
    // (không phân biệt Ca, loại trừ chính bản ghi đang sửa)
    // ==============================
    const vehicleExists = await Assignment.findOne({
      where: {
        ngay,
        vehicleId,
        id: {
          [Op.ne]: assignment.id,
        },
      },
    });

    if (vehicleExists) {
      return res.status(400).json({
        success: false,
        message: "Xe đã được phân công trong ngày này.",
      });
    }

    // ==============================
    // Chặn trùng tài xế
    // Trong cùng 1 ngày, 1 tài xế chỉ được phân công 1 lần
    // (không phân biệt Ca, loại trừ chính bản ghi đang sửa)
    // ==============================
    const driverExists = await Assignment.findOne({
      where: {
        ngay,
        driverId,
        id: {
          [Op.ne]: assignment.id,
        },
      },
    });

    if (driverExists) {
      return res.status(400).json({
        success: false,
        message: "Tài xế đã được phân công trong ngày này.",
      });
    }

    await assignment.update(req.body);

    res.json({
      success: true,
      data: assignment,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};

// ==============================
// Xóa phân công
// ==============================
exports.deleteAssignment = async (req, res) => {
  try {

    const assignment = await Assignment.findByPk(
      req.params.id
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phân công",
      });
    }

    if (denyIfOutOfScope(req, res, assignment)) return;

    await assignment.destroy();

    res.json({
      success: true,
      message: "Xóa phân công thành công",
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};