const XLSX = require("xlsx");

const Driver = require("../models/Driver");
const User = require("../models/User");
const { normalizeMsnv } = require("../utils/assignmentHelpers");
const { normalizeKhoName } = require("../utils/ensureWarehouses");

function cell(row, ...names) {
  const keys = Object.keys(row || {});

  for (const name of names) {
    if (row[name] != null && String(row[name]).trim() !== "") {
      return row[name];
    }

    const key = keys.find(
      (item) =>
        String(item).replace(/\u00a0/g, " ").trim().toLowerCase() ===
        name.toLowerCase()
    );

    if (key != null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }

  return "";
}

function normalizePhone(value) {
  let digits = String(value ?? "")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\.0+$/, "")
    .replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("84") && digits.length >= 11) {
    digits = "0" + digits.slice(2);
  } else if (!digits.startsWith("0") && digits.length === 9) {
    digits = "0" + digits;
  }

  return digits;
}

function normalizeLoaiBang(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) return "";

  const map = {
    B2: "B2",
    C: "C",
    C1: "C1",
    D: "D",
  };

  return map[raw] || String(value || "").trim();
}

function normalizeStatus(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Đang làm";

  const map = {
    "dang lam": "Đang làm",
    "đang làm": "Đang làm",
    "nghi viec": "Nghỉ việc",
    "nghỉ việc": "Nghỉ việc",
  };

  return map[raw.toLowerCase()] || raw;
}

function userStatusFromDriver(trangThai) {
  return trangThai === "Đang làm" ? "Hoạt động" : "Khóa";
}

function setPhoneIndex(map, phone, record) {
  if (phone) map.set(phone, record);
}

exports.downloadTemplate = (req, res) => {
  const rows = [
    {
      MSNV: "123456",
      "Họ tên": "Nguyễn Văn A",
      "Số điện thoại": "0901234567",
      Kho: "Tân Bình",
      GPLX: "123456789",
      "Loại bằng": "C",
      "Trạng thái": "Đang làm",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tai xe");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  res.setHeader(
    "Content-Disposition",
    'attachment; filename="mau-danh-sach-tai-xe.xlsx"'
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
};

exports.importExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Chưa chọn file.",
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { raw: false });

    let created = 0;
    let updated = 0;
    const errors = [];

    const drivers = await Driver.findAll();
    const users = await User.findAll();

    const driverByMsnv = new Map();
    const driverByPhone = new Map();
    for (const driver of drivers) {
      driverByMsnv.set(normalizeMsnv(driver.msnv), driver);
      setPhoneIndex(driverByPhone, normalizePhone(driver.soDienThoai), driver);
    }

    const userByMsnv = new Map();
    const userByPhone = new Map();
    for (const user of users) {
      userByMsnv.set(normalizeMsnv(user.msnv), user);
      setPhoneIndex(userByPhone, normalizePhone(user.soDienThoai), user);
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const msnv = normalizeMsnv(cell(row, "MSNV", "Msnv", "Mã NV"));
      const hoTen = String(
        cell(row, "Họ tên", "Ho ten", "Họ và tên") || ""
      ).trim();
      const soDienThoai = normalizePhone(
        cell(row, "Số điện thoại", "So dien thoai", "SĐT", "SDT")
      );
      const kho = normalizeKhoName(cell(row, "Kho"));
      const bangLai = String(cell(row, "GPLX", "Số GPLX", "Bang lai") || "").trim();
      const loaiBang = normalizeLoaiBang(cell(row, "Loại bằng", "Loai bang"));
      const trangThai = normalizeStatus(cell(row, "Trạng thái", "Trang thai"));

      if (!msnv || !hoTen || !soDienThoai || !kho) {
        errors.push(
          `Dòng ${i + 2}: Thiếu MSNV, họ tên, số điện thoại hoặc kho.`
        );
        continue;
      }

      try {
        const existedDriver = driverByMsnv.get(msnv);
        const phoneOwner = driverByPhone.get(soDienThoai);
        const userByCode = userByMsnv.get(msnv);
        const userByTel = userByPhone.get(soDienThoai);

        if (phoneOwner && phoneOwner.id !== existedDriver?.id) {
          errors.push(
            `Dòng ${i + 2}: SĐT ${soDienThoai} đã dùng cho MSNV ${phoneOwner.msnv}.`
          );
          continue;
        }

        if (
          userByTel &&
          normalizeMsnv(userByTel.msnv) !== msnv &&
          (!existedDriver || normalizeMsnv(userByTel.msnv) !== normalizeMsnv(existedDriver.msnv))
        ) {
          errors.push(
            `Dòng ${i + 2}: SĐT ${soDienThoai} đã tồn tại trong tài khoản User.`
          );
          continue;
        }

        if (userByCode && userByCode.quyen !== "DRIVER") {
          errors.push(
            `Dòng ${i + 2}: MSNV ${msnv} đã tồn tại với quyền ${userByCode.quyen}.`
          );
          continue;
        }

        if (existedDriver) {
          const oldPhone = normalizePhone(existedDriver.soDienThoai);

          await existedDriver.update({
            msnv,
            hoTen,
            soDienThoai,
            bangLai: bangLai || existedDriver.bangLai,
            loaiBang: loaiBang || existedDriver.loaiBang,
            kho,
            trangThai,
          });

          const user = userByCode || userByMsnv.get(normalizeMsnv(existedDriver.msnv));
          if (user) {
            await user.update({
              msnv,
              hoTen,
              soDienThoai,
              matKhau: soDienThoai,
              trangThai: userStatusFromDriver(trangThai),
            });
            userByMsnv.set(msnv, user);
            setPhoneIndex(userByPhone, soDienThoai, user);
          } else {
            const createdUser = await User.create({
              msnv,
              hoTen,
              soDienThoai,
              matKhau: soDienThoai,
              quyen: "DRIVER",
              trangThai: userStatusFromDriver(trangThai),
            });
            userByMsnv.set(msnv, createdUser);
            setPhoneIndex(userByPhone, soDienThoai, createdUser);
          }

          if (oldPhone && oldPhone !== soDienThoai) {
            driverByPhone.delete(oldPhone);
          }
          driverByMsnv.set(msnv, existedDriver);
          setPhoneIndex(driverByPhone, soDienThoai, existedDriver);
          updated++;
          continue;
        }

        const driver = await Driver.create({
          msnv,
          hoTen,
          soDienThoai,
          bangLai,
          loaiBang,
          kho,
          trangThai,
        });

        let createdUser = userByCode;
        if (createdUser) {
          await createdUser.update({
            msnv,
            hoTen,
            soDienThoai,
            matKhau: soDienThoai,
            quyen: "DRIVER",
            trangThai: userStatusFromDriver(trangThai),
          });
        } else {
          createdUser = await User.create({
            msnv,
            hoTen,
            soDienThoai,
            matKhau: soDienThoai,
            quyen: "DRIVER",
            trangThai: userStatusFromDriver(trangThai),
          });
        }

        driverByMsnv.set(msnv, driver);
        setPhoneIndex(driverByPhone, soDienThoai, driver);
        userByMsnv.set(msnv, createdUser);
        setPhoneIndex(userByPhone, soDienThoai, createdUser);
        created++;
      } catch (err) {
        errors.push(`Dòng ${i + 2} (${msnv}): ${err.message}`);
      }
    }

    res.json({
      success: true,
      imported: created + updated,
      created,
      updated,
      errors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
