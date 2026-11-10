const { Op } = require("sequelize");
const Warehouse = require("../models/Warehouse");
const { getUserKhoVariants, userKhoValue } = require("../utils/scopeHelpers");
const {
  recalculateAssignmentGpsForWarehouse,
  syncSiblingWarehouseCoords,
} = require("../utils/recalculateAssignmentGps");

exports.getWarehouses = async (req, res) => {
  try {
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

function parseWarehousePayload(body, { requireName = false } = {}) {
  const ten = String(body.ten || "").trim();
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const banKinh = Number(body.banKinh);

  if (requireName && !ten) {
    return { error: { status: 400, message: "Vui lòng nhập tên kho." } };
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { error: { status: 400, message: "Vui lòng nhập tọa độ GPS hợp lệ." } };
  }

  if (!Number.isFinite(banKinh) || banKinh < 20) {
    return { error: { status: 400, message: "Bán kính phải từ 20 mét trở lên." } };
  }

  return { ten, latitude, longitude, banKinh };
}

exports.createWarehouse = async (req, res) => {
  try {
    if (!req.user || !["SUPER_ADMIN", "ADMIN"].includes(req.user.quyen)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thêm kho.",
      });
    }

    const parsed = parseWarehousePayload(req.body, { requireName: true });
    if (parsed.error) {
      return res.status(parsed.error.status).json({
        success: false,
        message: parsed.error.message,
      });
    }

    const existed = await Warehouse.findOne({ where: { ten: parsed.ten } });
    if (existed) {
      return res.status(400).json({
        success: false,
        message: "Tên kho này đã tồn tại.",
      });
    }

    const warehouse = await Warehouse.create({
      ten: parsed.ten,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      banKinh: parsed.banKinh,
    });

    res.json({
      success: true,
      message: "Đã thêm kho mới.",
      data: warehouse,
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Tên kho này đã tồn tại.",
      });
    }

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

    const parsed = parseWarehousePayload(req.body);
    if (parsed.error) {
      return res.status(parsed.error.status).json({
        success: false,
        message: parsed.error.message,
      });
    }

    const coords = {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      banKinh: parsed.banKinh,
    };
    await warehouse.update(coords);
    await syncSiblingWarehouseCoords(warehouse, coords);
    const updatedGps = await recalculateAssignmentGpsForWarehouse(warehouse);

    res.json({
      success: true,
      message:
        updatedGps > 0
          ? `Đã cập nhật kho và tính lại GPS ${updatedGps} chuyến theo bán kính ${parsed.banKinh}m.`
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
