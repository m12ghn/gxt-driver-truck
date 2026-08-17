const sequelize = require("../database/database");
const User = require("../models/User");

async function createAdmin() {
  try {
    await sequelize.sync();

    const admin = await User.findOne({
      where: {
        msnv: "admin",
      },
    });

    if (admin) {
      console.log("Admin đã tồn tại.");
      process.exit();
    }

    await User.create({
      msnv: "admin",
      hoTen: "Administrator",
      soDienThoai: "0900000000",
      matKhau: "123456",
      quyen: "Admin",
      trangThai: "Hoạt động",
    });

    console.log("Tạo Admin thành công!");
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
}

createAdmin();