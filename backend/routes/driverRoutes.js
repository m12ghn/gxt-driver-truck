const express = require("express");
const router = express.Router();

const driverController = require("../controllers/driverController");
const driverImportController = require("../controllers/driverImportController");
const upload = require("../middlewares/uploadExcel");
// ==============================
// Import Excel
// ==============================
router.post(
  "/import",
  upload.single("file"),
  driverImportController.importExcel
);

// ==============================
// Danh sách tài xế
// ==============================
router.get("/", driverController.getDrivers);

// ==============================
// Chi tiết tài xế
// ==============================
router.get("/:id", driverController.getDriver);

// ==============================
// Thêm tài xế
// ==============================
router.post("/", driverController.createDriver);

// ==============================
// Cập nhật tài xế
// ==============================
router.put("/:id", driverController.updateDriver);

// ==============================
// Khóa / Mở tài xế
// ==============================
router.patch(
  "/:id/status",
  driverController.changeStatus
);

// ==============================
// Xóa tài xế
// ==============================
router.delete("/:id", driverController.deleteDriver);

module.exports = router;