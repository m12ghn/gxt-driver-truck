const Warehouse = require("../models/Warehouse");

// ==============================
// DANH SÁCH KHO
// (chỉ đọc - tọa độ kho được cấu hình sẵn trong DB,
// không có UI quản lý riêng theo yêu cầu ban đầu)
// ==============================
exports.getWarehouses = async (req, res) => {
  try {
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
