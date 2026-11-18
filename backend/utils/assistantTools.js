const { Op } = require("sequelize");
const Assignment = require("../models/Assignment");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const Warehouse = require("../models/Warehouse");
const {
  applyWarehouseScope,
  warehouseKhoFilter,
  userKhoValue,
  isLocationScoped,
  assertWarehouseAccess,
  getUserKhoVariants,
} = require("./scopeHelpers");
const { vietnamToday, formatVietnamDateTime } = require("./assignmentHelpers");
const { getCheckInStatus, getCheckOutStatus } = require("./shiftHelpers");
const { parseDuAn, duAnWhere } = require("../constants/projects");

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_overview",
      description:
        "Tổng quan chuyến theo ngày: tổng, Check In, hoàn thành, trễ Check In/Out, GPS, chờ xác nhận.",
      parameters: {
        type: "object",
        properties: {
          ngay: {
            type: "string",
            description: "YYYY-MM-DD, mặc định hôm nay",
          },
          duAn: {
            type: "string",
            description: "GXT hoặc VUNG_HCM. Bỏ trống = cả hai.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_assignments",
      description: "Liệt kê phân công theo ngày, trạng thái, kho, biển số hoặc MSNV.",
      parameters: {
        type: "object",
        properties: {
          ngay: { type: "string" },
          duAn: { type: "string" },
          trangThai: { type: "string" },
          kho: { type: "string" },
          bienSo: { type: "string" },
          msnv: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_driver",
      description: "Tìm tài xế theo MSNV hoặc họ tên, kèm chuyến hôm nay/ngày chỉ định.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          ngay: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_vehicle",
      description: "Tìm xe theo biển số.",
      parameters: {
        type: "object",
        properties: {
          bienSo: { type: "string" },
          ngay: { type: "string" },
        },
        required: ["bienSo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_locations",
      description: "Danh sách kho hoặc bưu cục (ID, tên, loại).",
      parameters: {
        type: "object",
        properties: {
          loai: {
            type: "string",
            description: "KHO hoặc BUU_CUC. Bỏ trống = tất cả trong phạm vi user.",
          },
        },
      },
    },
  },
];

function assignmentWhere(req, { ngay, duAn, kho }) {
  const day = ngay || vietnamToday();
  const where = applyWarehouseScope(req, { ngay: day });
  if (duAn) where.duAn = duAnWhere(duAn);
  if (kho) {
    try {
      assertWarehouseAccess(req, kho);
      where.kho = warehouseKhoFilter(kho);
    } catch {
      where.kho = "__NO_KHO__";
    }
  }
  return where;
}

function compactAssignment(item) {
  const ci = getCheckInStatus(item.checkInTime, item.ngay, item.ca);
  const co = getCheckOutStatus(item.checkOutTime, item.ngay, item.ca);
  return {
    ngay: item.ngay,
    ca: item.ca,
    kho: item.kho,
    duAn: item.duAn || "GXT",
    trangThai: item.trangThai,
    bienSo: item.Vehicle?.bienSo || "",
    msnv: item.Driver?.msnv || "",
    taiXe: item.Driver?.hoTen || "",
    checkIn: formatVietnamDateTime(item.checkInTime) || null,
    checkOut: formatVietnamDateTime(item.checkOutTime) || null,
    treCheckIn: ci?.late ? `${ci.minutes} phút` : null,
    treCheckOut: co?.late ? `${co.minutes} phút` : null,
    gpsCheckInSai: item.checkInGpsValid === false,
    gpsCheckOutSai: item.checkOutGpsValid === false,
    warehouseStatus: item.warehouseStatus || null,
  };
}

async function getOverview(req, args = {}) {
  const where = assignmentWhere(req, args);
  const rows = await Assignment.findAll({
    where,
    include: [
      { model: Vehicle, attributes: ["bienSo"] },
      { model: Driver, attributes: ["msnv", "hoTen"] },
    ],
  });

  const summary = {
    ngay: args.ngay || vietnamToday(),
    duAn: args.duAn || "tất cả",
    total: rows.length,
    chuaThucHien: 0,
    daCheckIn: 0,
    hoanThanh: 0,
    chuaHoanThanh: 0,
    treCheckIn: 0,
    treCheckOut: 0,
    gpsSai: 0,
    choXacNhan: 0,
  };

  for (const item of rows) {
    if (item.trangThai === "Chưa thực hiện") summary.chuaThucHien++;
    if (item.trangThai === "Đã Check In") summary.daCheckIn++;
    if (item.trangThai === "Hoàn thành") summary.hoanThanh++;
    if (item.trangThai === "Chưa hoàn thành") summary.chuaHoanThanh++;
    if (getCheckInStatus(item.checkInTime, item.ngay, item.ca)?.late) {
      summary.treCheckIn++;
    }
    if (getCheckOutStatus(item.checkOutTime, item.ngay, item.ca)?.late) {
      summary.treCheckOut++;
    }
    if (item.checkInGpsValid === false || item.checkOutGpsValid === false) {
      summary.gpsSai++;
    }
    if (item.warehouseStatus === "Chờ xác nhận") summary.choXacNhan++;
  }

  return summary;
}

async function listAssignments(req, args = {}) {
  const where = assignmentWhere(req, args);
  if (args.trangThai) where.trangThai = args.trangThai;

  const include = [
    { model: Vehicle, attributes: ["bienSo", "loaiXe"] },
    { model: Driver, attributes: ["msnv", "hoTen"] },
  ];

  if (args.bienSo) {
    include[0].where = {
      bienSo: { [Op.iLike]: `%${String(args.bienSo).trim()}%` },
    };
    include[0].required = true;
  }
  if (args.msnv) {
    include[1].where = {
      msnv: { [Op.iLike]: `%${String(args.msnv).trim()}%` },
    };
    include[1].required = true;
  }

  const rows = await Assignment.findAll({
    where,
    include,
    order: [
      ["ca", "ASC"],
      ["kho", "ASC"],
    ],
    limit: 40,
  });

  return {
    ngay: args.ngay || vietnamToday(),
    count: rows.length,
    items: rows.map(compactAssignment),
  };
}

async function lookupDriver(req, args = {}) {
  const q = String(args.query || "").trim().toLowerCase();
  if (!q) return { message: "Thiếu MSNV hoặc tên tài xế." };

  const drivers = await Driver.findAll({ limit: 200 });
  const matched = drivers
    .filter((d) => {
      const msnv = String(d.msnv || "").toLowerCase();
      const ten = String(d.hoTen || "").toLowerCase();
      return msnv.includes(q) || ten.includes(q);
    })
    .slice(0, 8);

  if (!matched.length) return { message: `Không tìm thấy tài xế "${args.query}".` };

  const day = args.ngay || vietnamToday();
  const showPhone = ["SUPER_ADMIN", "ADMIN"].includes(req.user?.quyen);

  const result = [];
  for (const driver of matched) {
    const where = applyWarehouseScope(req, {
      ngay: day,
      driverId: driver.id,
    });
    const trips = await Assignment.findAll({
      where,
      include: [{ model: Vehicle, attributes: ["bienSo"] }],
      limit: 8,
    });
    result.push({
      msnv: driver.msnv,
      hoTen: driver.hoTen,
      kho: driver.kho,
      trangThai: driver.trangThai,
      soDienThoai: showPhone ? driver.soDienThoai : undefined,
      chuyenNgay: trips.map((item) => ({
        ...compactAssignment({ ...item.toJSON(), Driver: driver }),
        bienSo: item.Vehicle?.bienSo || "",
      })),
    });
  }
  return { ngay: day, drivers: result };
}

async function lookupVehicle(req, args = {}) {
  const plate = String(args.bienSo || "").trim().toLowerCase();
  if (!plate) return { message: "Thiếu biển số." };

  const vehicles = await Vehicle.findAll({ limit: 400 });
  const matched = vehicles.filter((v) =>
    String(v.bienSo || "")
      .toLowerCase()
      .replace(/\s/g, "")
      .includes(plate.replace(/\s/g, ""))
  ).slice(0, 5);

  if (!matched.length) return { message: `Không tìm thấy xe "${args.bienSo}".` };

  const day = args.ngay || vietnamToday();
  const result = [];
  for (const vehicle of matched) {
    const where = applyWarehouseScope(req, {
      ngay: day,
      vehicleId: vehicle.id,
    });
    const trips = await Assignment.findAll({
      where,
      include: [{ model: Driver, attributes: ["msnv", "hoTen"] }],
      limit: 8,
    });
    result.push({
      bienSo: vehicle.bienSo,
      loaiXe: vehicle.loaiXe,
      kho: vehicle.kho,
      trangThai: vehicle.trangThai,
      kmHienTai: vehicle.kmHienTai,
      chuyenNgay: trips.map((item) =>
        compactAssignment({ ...item.toJSON(), Vehicle: vehicle })
      ),
    });
  }
  return { ngay: day, vehicles: result };
}

async function listLocations(req, args = {}) {
  const where = {};
  const loai = String(args.loai || "").toUpperCase();
  if (loai === "KHO" || loai === "BUU_CUC") where.loai = loai;
  if (isLocationScoped(req.user)) {
    const variants = getUserKhoVariants(userKhoValue(req.user));
    where.ten = variants.length ? { [Op.in]: variants } : "__NO_KHO__";
  }

  const rows = await Warehouse.findAll({
    where,
    attributes: ["idKho", "ten", "loai", "banKinh"],
    order: [["ten", "ASC"]],
    limit: 80,
  });

  return {
    count: rows.length,
    items: rows.map((w) => ({
      id: w.idKho,
      ten: w.ten,
      loai: w.loai === "BUU_CUC" ? "Bưu cục" : "Kho",
      banKinh: w.banKinh,
    })),
  };
}

async function runTool(req, name, rawArgs) {
  const args = rawArgs && typeof rawArgs === "object" ? { ...rawArgs } : {};
  if (args.duAn != null && String(args.duAn).trim()) {
    args.duAn = parseDuAn(args.duAn);
  } else {
    delete args.duAn;
  }

  switch (name) {
    case "get_overview":
      return getOverview(req, args);
    case "list_assignments":
      return listAssignments(req, args);
    case "lookup_driver":
      return lookupDriver(req, args);
    case "lookup_vehicle":
      return lookupVehicle(req, args);
    case "list_locations":
      return listLocations(req, args);
    default:
      return { error: `Không có tool ${name}` };
  }
}

module.exports = { TOOLS, runTool };
