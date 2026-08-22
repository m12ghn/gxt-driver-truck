const { Op } = require("sequelize");
const Warehouse = require("../models/Warehouse");
const { ensureWarehouses } = require("../utils/ensureWarehouses");
const { getUserKhoVariants, userKhoValue } = require("../utils/scopeHelpers");
const {
  recalculateAssignmentGpsForWarehouse,
  syncSiblingWarehouseCoords,
} = require("../utils/recalculateAssignmentGps");

exports.getWarehouses = async (req, res) => {
  try {
    await ensureWarehouses();

    const where = {};

    if (req.user?.quyen === "WAREHOUSE") {
      const variants = getUserKhoVariants(userKhoValue(req.user));
      where.ten = variants.length ? { [Op.in]: variants } : "__NO_KHO__";
    }

    const warehouses = await Warehouse.findAll({
      where,
      order: [["ten", "ASC"]],
    });

    res.json({
      success: true,
      data: warehouses,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    if (!req.user || !["SUPER_ADMIN", "ADMIN"].includes(req.user.quyen)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền cập nhật kho.",
      });
    }

    const warehouse = await Warehouse.findByPk(req.params.id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kho.",
      });
    }

    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    const banKinh = Number(req.body.banKinh);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tọa độ GPS hợp lệ.",
      });
    }

    if (!Number.isFinite(banKinh) || banKinh < 20) {
      return res.status(400).json({
        success: false,
        message: "Bán kính phải từ 20 mét trở lên.",
      });
    }

    const coords = { latitude, longitude, banKinh };
    await warehouse.update(coords);
    await syncSiblingWarehouseCoords(warehouse, coords);
    const updatedGps = await recalculateAssignmentGpsForWarehouse(warehouse);

    res.json({
      success: true,
      message:
        updatedGps > 0
          ? `Đã cập nhật kho và tính lại GPS ${updatedGps} chuyến theo bán kính ${banKinh}m.`
          : "Đã cập nhật tọa độ kho.",
      updatedGps,
      data: warehouse,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
