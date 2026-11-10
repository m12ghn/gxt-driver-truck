const { Op } = require("sequelize");
const Warehouse = require("../models/Warehouse");
const {
  getUserKhoVariants,
  userKhoValue,
  isLocationScoped,
} = require("../utils/scopeHelpers");
const { ensureWarehouseColumns } = require("../utils/ensureWarehouseColumns");
const {
  recalculateAssignmentGpsForWarehouse,
  syncSiblingWarehouseCoords,
} = require("../utils/recalculateAssignmentGps");

exports.getWarehouses = async (req, res) => {
  try {
    await ensureWarehouseColumns();

    const where = {};

    if (isLocationScoped(req.user)) {
      const variants = getUserKhoVariants(userKhoValue(req.user));
      where.ten = variants.length ? { [Op.in]: variants } : "__NO_KHO__";
    }

    const loai = String(req.query.loai || "").toUpperCase();
    if (loai === "KHO" || loai === "BUU_CUC") {
      where.loai = loai;
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

function parseWarehousePayload(body, { requireName = false, requireIdKho = false } = {}) {
  const ten = String(body.ten || "").trim();
  const idKho = String(body.idKho || "").trim();
  const loai = String(body.loai || "").toUpperCase() === "BUU_CUC" ? "BUU_CUC" : "KHO";
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const banKinh = Number(body.banKinh);

  if (requireIdKho && !idKho) {
    return { error: { status: 400, message: "Vui lòng nhập ID kho/bưu cục." } };
  }

  if (requireName && !ten) {
    return { error: { status: 400, message: "Vui lòng nhập tên kho/bưu cục." } };
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { error: { status: 400, message: "Vui lòng nhập tọa độ GPS hợp lệ." } };
  }

  if (!Number.isFinite(banKinh) || banKinh < 20) {
    return { error: { status: 400, message: "Bán kính phải từ 20 mét trở lên." } };
  }

  return { ten, idKho: idKho || null, loai, latitude, longitude, banKinh };
}

exports.createWarehouse = async (req, res) => {
  try {
    if (!req.user || !["SUPER_ADMIN", "ADMIN"].includes(req.user.quyen)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thêm kho.",
      });
    }

    await ensureWarehouseColumns();

    const parsed = parseWarehousePayload(req.body, {
      requireName: true,
      requireIdKho: true,
    });
    if (parsed.error) {
      return res.status(parsed.error.status).json({
        success: false,
        message: parsed.error.message,
      });
    }

    const existedName = await Warehouse.findOne({ where: { ten: parsed.ten } });
    if (existedName) {
      return res.status(400).json({
        success: false,
        message: "Tên này đã tồn tại.",
      });
    }

    const existedId = await Warehouse.findOne({ where: { idKho: parsed.idKho } });
    if (existedId) {
      return res.status(400).json({
        success: false,
        message: "ID này đã tồn tại.",
      });
    }

    const warehouse = await Warehouse.create({
      idKho: parsed.idKho,
      ten: parsed.ten,
      loai: parsed.loai,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      banKinh: parsed.banKinh,
    });

    res.json({
      success: true,
      message: parsed.loai === "BUU_CUC" ? "Đã thêm bưu cục mới." : "Đã thêm kho mới.",
      data: warehouse,
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      const fields = Object.keys(err.fields || {});
      return res.status(400).json({
        success: false,
        message: fields.includes("idKho")
          ? "ID này đã tồn tại."
          : "Tên này đã tồn tại.",
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

    await ensureWarehouseColumns();

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

    if (parsed.idKho) {
      const existedId = await Warehouse.findOne({
        where: { idKho: parsed.idKho, id: { [Op.ne]: warehouse.id } },
      });
      if (existedId) {
        return res.status(400).json({
          success: false,
          message: "ID này đã tồn tại.",
        });
      }
    }

    const gpsChanged =
      Math.abs(Number(warehouse.latitude) - parsed.latitude) > 1e-7 ||
      Math.abs(Number(warehouse.longitude) - parsed.longitude) > 1e-7 ||
      Number(warehouse.banKinh) !== parsed.banKinh;

    const coords = {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      banKinh: parsed.banKinh,
    };

    await warehouse.update({
      idKho: parsed.idKho,
      loai: parsed.loai,
      ...coords,
    });

    let updatedGps = 0;
    if (gpsChanged) {
      await syncSiblingWarehouseCoords(warehouse, coords);
      updatedGps = await recalculateAssignmentGpsForWarehouse(warehouse);
    }

    res.json({
      success: true,
      message: gpsChanged
        ? updatedGps > 0
          ? `Đã cập nhật kho và tính lại GPS ${updatedGps} chuyến theo bán kính ${parsed.banKinh}m.`
          : "Đã cập nhật tọa độ kho."
        : "Đã cập nhật kho/bưu cục.",
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
