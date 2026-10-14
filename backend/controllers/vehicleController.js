const Vehicle = require("../models/Vehicle");
const Assignment = require("../models/Assignment");
const Driver = require("../models/Driver");
const { backfillVehicleKmFromAssignments } = require("../utils/syncVehicleKm");
const { vietnamToday } = require("../utils/assignmentHelpers");

// Lấy danh sách xe
exports.getVehicles = async (req, res) => {
  try {
    await backfillVehicleKmFromAssignments().catch((err) =>
      console.error("backfillVehicleKmFromAssignments:", err.message)
    );

    const today = vietnamToday();
    const vehicles = await Vehicle.findAll({
      order: [["id", "DESC"]],
    });

    const todayTrips = await Assignment.findAll({
      where: { ngay: today },
      include: [
        { model: Driver, attributes: ["hoTen", "msnv"] },
      ],
    });

    const tripByVehicle = new Map();
    for (const trip of todayTrips) {
      tripByVehicle.set(Number(trip.vehicleId), trip);
    }

    const data = vehicles.map((vehicle) => {
      const item = vehicle.toJSON();
      const trip = tripByVehicle.get(Number(vehicle.id));
      item.coLichHomNay = Boolean(trip);
      item.trangThaiHomNay = trip ? "Hoạt động" : "Không hoạt động";
      item.lichHomNay = trip
        ? {
            ca: trip.ca,
            kho: trip.kho,
            trangThai: trip.trangThai,
            taiXe: trip.Driver?.hoTen || "",
            msnv: trip.Driver?.msnv || "",
          }
        : null;
      return item;
    });

    res.json({
      success: true,
      data,
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