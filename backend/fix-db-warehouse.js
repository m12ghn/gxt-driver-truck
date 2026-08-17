const { DataTypes } = require("sequelize");
const sequelize = require("./database/database");

async function run() {

  const qi = sequelize.getQueryInterface();

  const table = await qi.describeTable("Assignments");

  // ==============================
  // 1. Thêm cột nếu chưa có
  // ==============================
  if (!table.warehouseStatus) {
    await qi.addColumn("Assignments", "warehouseStatus", {
      type: DataTypes.STRING,
      allowNull: true,
    });
    console.log("✅ Added column warehouseStatus");
  } else {
    console.log("↷ warehouseStatus đã tồn tại");
  }

  if (!table.warehouseReason) {
    await qi.addColumn("Assignments", "warehouseReason", {
      type: DataTypes.TEXT,
      allowNull: true,
    });
    console.log("✅ Added column warehouseReason");
  } else {
    console.log("↷ warehouseReason đã tồn tại");
  }

  if (!table.warehouseConfirmBy) {
    await qi.addColumn("Assignments", "warehouseConfirmBy", {
      type: DataTypes.STRING,
      allowNull: true,
    });
    console.log("✅ Added column warehouseConfirmBy");
  } else {
    console.log("↷ warehouseConfirmBy đã tồn tại");
  }

  if (!table.warehouseConfirmTime) {
    await qi.addColumn("Assignments", "warehouseConfirmTime", {
      type: DataTypes.DATE,
      allowNull: true,
    });
    console.log("✅ Added column warehouseConfirmTime");
  } else {
    console.log("↷ warehouseConfirmTime đã tồn tại");
  }

  // ==============================
  // 2. Đồng bộ dữ liệu cũ theo logic mới
  // ==============================

  // Chuyến cũ "Đã Check Out" -> "Hoàn thành"
  const [r1] = await sequelize.query(
    `UPDATE Assignments SET trangThai = 'Hoàn thành' WHERE trangThai = 'Đã Check Out'`
  );
  console.log(`✅ Đã cập nhật trangThai 'Đã Check Out' -> 'Hoàn thành'`);

  // Chuyến chưa Check Out thì warehouseStatus phải rỗng (không hiện "Chờ xác nhận" sớm)
  await sequelize.query(
    `UPDATE Assignments SET warehouseStatus = NULL WHERE checkOutTime IS NULL`
  );
  console.log(`✅ Đã reset warehouseStatus cho chuyến chưa Check Out`);

  // Chuyến đã Check Out nhưng chưa có warehouseStatus -> "Chờ xác nhận"
  await sequelize.query(
    `UPDATE Assignments SET warehouseStatus = 'Chờ xác nhận' WHERE checkOutTime IS NOT NULL AND (warehouseStatus IS NULL OR warehouseStatus = '')`
  );
  console.log(`✅ Đã set warehouseStatus = 'Chờ xác nhận' cho chuyến đã Check Out`);

  console.log("🎉 Done. Assignments table đã sẵn sàng cho logic trạng thái mới.");

  process.exit(0);

}

run().catch((err) => {
  console.error("❌ Lỗi migration:", err);
  process.exit(1);
});
