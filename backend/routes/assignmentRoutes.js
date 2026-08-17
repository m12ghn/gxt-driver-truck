const express = require("express");
const router = express.Router();

const assignmentController = require("../controllers/assignmentController");
const driverPortalController = require("../controllers/driverPortalController");
const {
  makeUploader,
  makeIncidentUploader,
} = require("../middlewares/uploadDriverPhotos");
const attachUser = require("../middlewares/attachUser");

// Gắn user admin/kho (driver portal không gửi header → req.user = null)
router.use(attachUser);

// ==============================
// Driver - Lấy phân công hôm nay
// ==============================
router.get("/today/:msnv", assignmentController.getTodayAssignment);

// ==============================
// Driver Portal - Lịch sử chuyến
// ==============================
router.get(
  "/history/:msnv",
  driverPortalController.getAssignmentHistory
);

// ==============================
// Driver Portal - Tự Check In
// (bắt buộc 6 ảnh real-time + đúng bán kính GPS kho)
// ==============================
router.put(
  "/:id/driver-checkin",
  makeUploader("checkin"),
  driverPortalController.driverCheckIn
);

// ==============================
// Driver Portal - Tự Check Out
// (bắt buộc 6 ảnh real-time + đúng bán kính GPS kho)
// ==============================
router.put(
  "/:id/driver-checkout",
  makeUploader("checkout"),
  driverPortalController.driverCheckOut
);

// ==============================
// Driver Portal - Báo cáo sự cố / sửa chữa dọc đường
// ==============================
router.post(
  "/:id/incidents",
  makeIncidentUploader(),
  driverPortalController.createIncident
);

router.get(
  "/:id/incidents",
  driverPortalController.getIncidents
);

// ==============================
// Admin - Danh sách phân công hôm nay
// ==============================
router.get("/today", assignmentController.getTodayAssignments);

// ==============================
// CHECK IN
// ==============================
router.put(
  "/:id/checkin",
  assignmentController.checkIn
);

// ==============================
// CHECK OUT
// ==============================
router.put(
  "/:id/checkout",
  assignmentController.checkOut
);

// ==============================
// ADMIN CHECK OUT HỘ
// ==============================
router.put(
  "/:id/admin-checkout",
  assignmentController.adminCheckOut
);

// ==============================
// KHO XÁC NHẬN
// ==============================
router.put(
  "/:id/warehouse-confirm",
  assignmentController.confirmWarehouse
);

// ==============================
// Xuất Excel danh sách phân công
// ==============================
router.get("/export", assignmentController.exportExcel);

// ==============================
// Danh sách tất cả phân công
// ==============================
router.get("/", assignmentController.getAssignments);

// ==============================
// Thêm phân công
// ==============================
router.post("/", assignmentController.createAssignment);

// ==============================
// Cập nhật phân công
// ==============================
router.put("/:id", assignmentController.updateAssignment);

// ==============================
// Xóa phân công
// ==============================
router.delete("/:id", assignmentController.deleteAssignment);

module.exports = router;