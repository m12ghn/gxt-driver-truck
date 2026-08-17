// One-off script: tạo bù tài khoản User (DRIVER) cho các Driver
// đã tồn tại trong bảng Drivers nhưng chưa có User tương ứng
// (dữ liệu cũ được tạo trước khi có logic đồng bộ Driver <-> User).
//
// Cách chạy: cd backend && node fix-missing-driver-users.js

const Driver = require("./models/Driver");
const User = require("./models/User");

async function run() {
  const drivers = await Driver.findAll();

  console.log(`Tổng số Driver: ${drivers.length}`);

  let created = 0;
  let skipped = 0;

  for (const driver of drivers) {
    const existedUser = await User.findOne({
      where: { msnv: driver.msnv },
    });

    if (existedUser) {
      skipped++;
      continue;
    }

    const existedPhone = await User.findOne({
      where: { soDienThoai: driver.soDienThoai },
    });

    if (existedPhone) {
      console.log(
        `BỎ QUA MSNV ${driver.msnv}: số điện thoại ${driver.soDienThoai} đã được User khác (MSNV ${existedPhone.msnv}) sử dụng. Cần xử lý tay.`
      );
      skipped++;
      continue;
    }

    await User.create({
      msnv: driver.msnv,
      hoTen: driver.hoTen,
      soDienThoai: driver.soDienThoai,
      matKhau: driver.msnv,
      quyen: "DRIVER",
      trangThai:
        driver.trangThai === "Đang làm" ? "Hoạt động" : "Khóa",
    });

    console.log(
      `Đã tạo User cho Driver MSNV ${driver.msnv} (${driver.hoTen}), mật khẩu mặc định = ${driver.msnv}`
    );

    created++;
  }

  console.log(`Hoàn tất. Đã tạo: ${created}. Bỏ qua: ${skipped}.`);

  process.exit(0);
}

run().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
