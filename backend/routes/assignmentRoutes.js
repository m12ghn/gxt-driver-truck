const express = require("express");
const router = express.Router();

const assignmentController = require("../controllers/assignmentController");
const driverPortalController = require("../controllers/driverPortalController");
const {
  makeUploader,
  makeIncidentUploader,
  optionalMultipart,
} = require("../middlewares/uploadDriverPhotos");
const attachUser = require("../middlewares/attachUser");
const {
  requireDriverPortalAuth,
  requireRole,
  driverSelfOnly,
} = require("../middlewares/auth");

const adminSide = requireRole("SUPER_ADMIN", "ADMIN", "WAREHOUSE");

// Gắn user admin/kho (driver portal không gửi header → req.user = null)
router.use(requireDriverPortalAuth, attachUser);

// ==============================
// Driver - Lấy phân công hôm nay
// ==============================
router.get("/today/:msnv", driverSelfOnly, assignmentController.getTodayAssignment);

// ==============================
// Driver Portal - Lịch sử chuyến
// ==============================
router.get(
  "/history/:msnv",
  driverSelfOnly,
  driverPortalController.getAssignmentHistory
);

// ==============================
// Driver Portal - Tự Check In
// (bắt buộc 6 ảnh real-time + đúng bán kính GPS kho)
// ==============================
router.put(
  "/:id/driver-checkin",
  optionalMultipart(makeUploader()),
  driverPortalController.driverCheckIn
);

// ==============================
// Driver Portal - Tự Check Out
// (bắt buộc 6 ảnh real-time + đúng bán kính GPS kho)
// ==============================
router.put(
  "/:id/driver-checkout",
  optionalMultipart(makeUploader()),
  driverPortalController.driverCheckOut
);

// ==============================
// Driver Portal - Báo cáo sự cố / sửa chữa dọc đường
// ==============================
router.post(
  "/:id/incidents",
  optionalMultipart(makeIncidentUploader()),
  driverPortalController.createIncident
);

router.get(
  "/:id/incidents",
  driverPortalController.getIncidents
);

// ==============================
// Admin - Danh sách phân công hôm nay
// ==============================
router.get("/today", adminSide, assignmentController.getTodayAssignments);

// ==============================
// CHECK IN
// ==============================
router.put(
  "/:id/checkin",
  adminSide,
  assignmentController.checkIn
);

// ==============================
// CHECK OUT
// ==============================
router.put(
  "/:id/checkout",
  adminSide,
  assignmentController.checkOut
);

// ==============================
// ADMIN CHECK OUT HỘ
// ==============================
router.put(
  "/:id/admin-checkout",
  adminSide,
  assignmentController.adminCheckOut
);

// ==============================
// KHO XÁC NHẬN
// ==============================
router.put(
  "/:id/warehouse-confirm",
  adminSide,
  assignmentController.confirmWarehouse
);

// ==============================
// Xuất Excel danh sách phân công
// ==============================
router.get("/export", adminSide, assignmentController.exportExcel);

// ==============================
// Danh sách tất cả phân công
// ==============================
router.get("/", adminSide, assignmentController.getAssignments);

// ==============================
// Thêm phân công
// ==============================
router.post("/", adminSide, assignmentController.createAssignment);

// ==============================
// Cập nhật phân công
// ==============================
router.put("/:id", adminSide, assignmentController.updateAssignment);

// ==============================
// Xóa phân công
// ==============================
router.delete("/:id", adminSide, assignmentController.deleteAssignment);

module.exports = router;