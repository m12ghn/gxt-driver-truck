const Vehicle = require("../models/Vehicle");
const { backfillVehicleKmFromAssignments } = require("../utils/syncVehicleKm");

// Lấy danh sách xe
exports.getVehicles = async (req, res) => {
  try {
    await backfillVehicleKmFromAssignments().catch((err) =>
      console.error("backfillVehicleKmFromAssignments:", err.message)
    );

    const vehicles = await Vehicle.findAll({
      order: [["id", "DESC"]],
    });

    res.json({
      success: true,
      data: vehicles,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Thêm xe
exports.createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);

    res.status(201).json({
      success: true,
      data: vehicle,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Lấy 1 xe
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe",
      });
    }

    res.json({
      success: true,
      data: vehicle,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Cập nhật xe
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe",
      });
    }

    await vehicle.update(req.body);

    res.json({
      success: true,
      data: vehicle,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Xóa xe
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy xe",
      });
    }

    await vehicle.destroy();

    res.json({
      success: true,
      message: "Đã xóa xe",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};