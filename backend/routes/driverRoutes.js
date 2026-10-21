const express = require("express");
const router = express.Router();

const driverController = require("../controllers/driverController");
const driverImportController = require("../controllers/driverImportController");
const upload = require("../middlewares/uploadExcel");
const { requireAuth, requireRole } = require("../middlewares/auth");
const adminSide = requireRole("SUPER_ADMIN", "ADMIN", "WAREHOUSE");
const adminOnly = requireRole("SUPER_ADMIN", "ADMIN");

router.use(requireAuth);

router.get("/template", adminOnly, driverImportController.downloadTemplate);

router.post(
  "/import",
  adminOnly,
  upload.single("file"),
  driverImportController.importExcel
);

// ==============================
// Danh sách tài xế
// ==============================
router.get("/", adminSide, driverController.getDrivers);

// ==============================
// Chi tiết tài xế
// ==============================
router.get("/:id", adminSide, driverController.getDriver);

// ==============================
// Thêm tài xế
// ==============================
router.post("/", adminOnly, driverController.createDriver);

// ==============================
// Cập nhật tài xế
// ==============================
router.put("/:id", adminOnly, driverController.updateDriver);

// ==============================
// Khóa / Mở tài xế
// ==============================
router.patch(
  "/:id/status",
  adminOnly,
  driverController.changeStatus
);

// ==============================
// Xóa tài xế
// ==============================
router.delete("/:id", adminOnly, driverController.deleteDriver);

module.exports = router;