const express = require("express");
const router = express.Router();

const vehicleController = require("../controllers/vehicleController");

// Lấy danh sách xe
router.get("/", vehicleController.getVehicles);

// Lấy chi tiết 1 xe
router.get("/:id", vehicleController.getVehicle);

// Thêm xe
router.post("/", vehicleController.createVehicle);

// Cập nhật xe
router.put("/:id", vehicleController.updateVehicle);

// Xóa xe
router.delete("/:id", vehicleController.deleteVehicle);

module.exports = router;