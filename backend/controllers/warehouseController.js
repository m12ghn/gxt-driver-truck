const Warehouse = require("../models/Warehouse");
const { ensureWarehouses } = require("../utils/ensureWarehouses");

exports.getWarehouses = async (req, res) => {
  try {
    await ensureWarehouses();

    const where = {};

    if (req.user?.quyen === "WAREHOUSE" && req.user.kho) {
      where.ten = req.user.kho;
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

    await warehouse.update({ latitude, longitude, banKinh });

    res.json({
      success: true,
      message: "Đã cập nhật tọa độ kho.",
      data: warehouse,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
