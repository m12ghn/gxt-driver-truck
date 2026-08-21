const { Op } = require("sequelize");
const XLSX = require("xlsx");

const Assignment = require("../models/Assignment");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

const { markOverdueAssignments, vietnamToday } = require("../utils/assignmentHelpers");
const {
  applyWarehouseScope,
  getScopedKho,
  warehouseKhoFilter,
} = require("../utils/scopeHelpers");
const {
  getCheckInStatus,
  getMissingCheckInAlert,
} = require("../utils/shiftHelpers");

const ASSIGNMENT_STATS_ATTRS = [
  "id",
  "ngay",
  "ca",
  "kho",
  "trangThai",
  "checkInTime",
  "checkOutTime",
  "checkInGpsValid",
  "checkOutGpsValid",
  "warehouseStatus",
];

const DRIVER_MIN_ATTRS = ["id", "msnv", "hoTen"];
const VEHICLE_MIN_ATTRS = ["id", "bienSo"];

function vnDateStr(date = new Date()) {
  return date.toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function hasGpsViolation(item) {
  return (
    item.checkInGpsValid === false || item.checkOutGpsValid === false
  );
}

// Tính các chỉ số tổng hợp cho 1 danh sách Assignment (dùng chung cho
// Dashboard hôm nay, biểu đồ xu hướng, và Report theo khoảng ngày).
function summarize(assignments) {
  const summary = {
    total: assignments.length,
    chuaThucHien: 0,
    daCheckIn: 0,
    hoanThanh: 0,
    chuaHoanThanh: 0,
    late: 0,
    gpsViolation: 0,
    choXacNhan: 0,
    daXacNhan: 0,
    khongXacNhan: 0,
  };

  for (const item of assignments) {
    if (item.trangThai === "Chưa thực hiện") summary.chuaThucHien++;
    if (item.trangThai === "Đã Check In") summary.daCheckIn++;
    if (item.trangThai === "Hoàn thành") summary.hoanThanh++;
    if (item.trangThai === "Chưa hoàn thành") summary.chuaHoanThanh++;

    const checkInStatus = getCheckInStatus(
      item.checkInTime,
      item.ngay,
      item.ca
    );

    if (checkInStatus?.late) summary.late++;
    if (hasGpsViolation(item)) summary.gpsViolation++;

    if (item.warehouseStatus === "Chờ xác nhận") summary.choXacNhan++;
    if (item.warehouseStatus === "Đã xác nhận") summary.daXacNhan++;
    if (item.warehouseStatus === "Không xác nhận") summary.khongXacNhan++;
  }

  return summary;
}

// ==============================
// GET /api/stats/dashboard
// Số liệu hôm nay + xu hướng 7 ngày gần nhất
// ==============================
exports.getDashboardStats = async (req, res) => {
  try {
    markOverdueAssignments().catch((err) =>
      console.error("markOverdueAssignments:", err.message)
    );

    const todayStr = vietnamToday();
    const today = new Date(`${todayStr}T12:00:00+07:00`);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const fromStr = vnDateStr(sevenDaysAgo);

    const where = applyWarehouseScope(req, {
      ngay: { [Op.between]: [fromStr, todayStr] },
    });

    const scopedKho = getScopedKho(req);
    const resourceWhere = scopedKho
      ? { kho: warehouseKhoFilter(scopedKho) }
      : {};

    const [assignments, vehicles, drivers] = await Promise.all([
      Assignment.findAll({
        where,
        attributes: ASSIGNMENT_STATS_ATTRS,
      }),
      Vehicle.findAll({
        where: resourceWhere,
        attributes: ["trangThai"],
      }),
      Driver.findAll({
        where: resourceWhere,
        attributes: ["trangThai"],
      }),
    ]);

    const todayAssignments = assignments.filter(
      (item) => item.ngay === todayStr
    );

    const todaySummary = summarize(todayAssignments);

    const trend = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = vnDateStr(d);

      const dayAssignments = assignments.filter(
        (item) => item.ngay === dStr
      );

      const daySummary = summarize(dayAssignments);

      trend.push({
        ngay: dStr,
        total: daySummary.total,
        hoanThanh: daySummary.hoanThanh,
        late: daySummary.late,
        gpsViolation: daySummary.gpsViolation,
      });
    }

    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(
      (item) => item.trangThai === "Hoạt động"
    ).length;
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(
      (item) => item.trangThai === "Đang làm"
    ).length;

    res.json({
      success: true,
      data: {
        today: todaySummary,
        vehicles: { total: totalVehicles, active: activeVehicles },
        drivers: { total: totalDrivers, active: activeDrivers },
        trend,
        kho: scopedKho,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==============================
// GET /api/stats/alerts
// Cảnh báo cần xử lý: trễ giờ / GPS / quá hạn (hôm nay)
// + chờ kho xác nhận (còn pending)
// ==============================
exports.getAlerts = async (req, res) => {
  try {
    markOverdueAssignments().catch((err) =>
      console.error("markOverdueAssignments:", err.message)
    );

    const todayStr = vietnamToday();

    const includeMin = [
      { model: Vehicle, attributes: VEHICLE_MIN_ATTRS },
      { model: Driver, attributes: DRIVER_MIN_ATTRS },
    ];

    const [todayAssignments, pendingWarehouse] = await Promise.all([
      Assignment.findAll({
        where: applyWarehouseScope(req, { ngay: todayStr }),
        attributes: ASSIGNMENT_STATS_ATTRS,
        include: includeMin,
        order: [["updatedAt", "DESC"]],
      }),
      Assignment.findAll({
        where: applyWarehouseScope(req, {
          warehouseStatus: "Chờ xác nhận",
        }),
        attributes: ASSIGNMENT_STATS_ATTRS,
        include: includeMin,
        order: [["checkOutTime", "DESC"]],
      }),
    ]);

    const items = [];

    function pushItem(item, type, label, detail, extra = {}) {
      items.push({
        id: item.id,
        type,
        label,
        detail,
        ngay: item.ngay,
        ca: item.ca,
        kho: item.kho,
        trangThai: item.trangThai,
        driverName: item.Driver?.hoTen || "—",
        driverMsnv: item.Driver?.msnv || "",
        bienSo: item.Vehicle?.bienSo || "—",
        checkInTime: item.checkInTime,
        ...extra,
      });
    }

    const now = new Date();

    for (const item of todayAssignments) {
      if (item.trangThai === "Chưa hoàn thành") {
        pushItem(
          item,
          "chuaHoanThanh",
          "Chưa hoàn thành (quá hạn)",
          "Chưa Check Out đúng giờ ca"
        );
      }

      const missingCheckIn = getMissingCheckInAlert(
        item.ngay,
        item.ca,
        item.checkInTime,
        now
      );

      if (missingCheckIn) {
        pushItem(
          item,
          "chuaCheckIn",
          "Chưa Check In",
          `Quá giờ vào ca ${missingCheckIn.shiftStartLabel} — đã ${missingCheckIn.minutes} phút`,
          { minutes: missingCheckIn.minutes }
        );
      }

      const checkInStatus = getCheckInStatus(
        item.checkInTime,
        item.ngay,
        item.ca
      );

      if (checkInStatus?.late) {
        pushItem(
          item,
          "late",
          "Trễ giờ Check In",
          `Trễ ${checkInStatus.minutes} phút so với 7:30`,
          { minutes: checkInStatus.minutes }
        );
      }

      if (hasGpsViolation(item)) {
        const parts = [];
        if (item.checkInGpsValid === false) parts.push("Check In");
        if (item.checkOutGpsValid === false) parts.push("Check Out");
        pushItem(
          item,
          "gps",
          "Vi phạm GPS",
          `${parts.join(" & ")} ngoài bán kính kho`
        );
      }
    }

    for (const item of pendingWarehouse) {
      pushItem(
        item,
        "choXacNhan",
        "Chờ kho xác nhận",
        "Đã Check Out — cần kho xử lý"
      );
    }

    const typeOrder = {
      chuaCheckIn: 0,
      choXacNhan: 1,
      chuaHoanThanh: 2,
      late: 3,
      gps: 4,
    };

    const groupMap = new Map();
    for (const item of items) {
      const key = `${item.type}||${item.kho || ""}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          type: item.type,
          kho: item.kho || "Không rõ kho",
          label: item.label,
          count: 0,
          trips: [],
        });
      }
      const group = groupMap.get(key);
      group.count += 1;
      group.trips.push({
        id: item.id,
        driverName: item.driverName,
        bienSo: item.bienSo,
        ca: item.ca,
        ngay: item.ngay,
        checkInTime: item.checkInTime,
        minutes: item.minutes || 0,
        detail: item.detail,
      });
    }

    const groups = [...groupMap.values()]
      .map((group) => {
        if (group.type === "late" || group.type === "chuaCheckIn") {
          group.trips.sort((a, b) => (b.minutes || 0) - (a.minutes || 0));
        }
        return group;
      })
      .sort(
        (a, b) =>
          (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9) ||
          b.count - a.count
      );

    items.sort(
      (a, b) => (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9)
    );

    const counts = {
      chuaCheckIn: items.filter((i) => i.type === "chuaCheckIn").length,
      late: items.filter((i) => i.type === "late").length,
      gpsViolation: items.filter((i) => i.type === "gps").length,
      chuaHoanThanh: items.filter((i) => i.type === "chuaHoanThanh").length,
      choXacNhan: pendingWarehouse.length,
    };

    counts.total =
      counts.chuaCheckIn +
      counts.late +
      counts.gpsViolation +
      counts.chuaHoanThanh +
      counts.choXacNhan;

    res.json({
      success: true,
      data: {
        counts,
        groups,
        items: items.slice(0, 20),
        refreshedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==============================
// Tính toán Report theo khoảng ngày (dùng chung cho JSON + Excel)
// ==============================
async function buildReportData({ from, to, kho }) {
  const where = {
    ngay: { [Op.between]: [from, to] },
  };

  // kho đã được resolve ở controller (WAREHOUSE bị ép kho của mình)
  if (kho) where.kho = kho;

  const assignments = await Assignment.findAll({
    where,
    include: [Vehicle, Driver],
    order: [["ngay", "ASC"]],
  });

  const summary = summarize(assignments);

  // ==============================
  // Theo tài xế
  // ==============================
  const driverMap = new Map();

  for (const item of assignments) {
    const driver = item.Driver;
    if (!driver) continue;

    const key = driver.msnv;

    if (!driverMap.has(key)) {
      driverMap.set(key, {
        msnv: driver.msnv,
        hoTen: driver.hoTen,
        total: 0,
        hoanThanh: 0,
        late: 0,
        gpsViolation: 0,
      });
    }

    const stat = driverMap.get(key);
    stat.total++;

    if (item.trangThai === "Hoàn thành") stat.hoanThanh++;

    const checkInStatus = getCheckInStatus(
      item.checkInTime,
      item.ngay,
      item.ca
    );

    if (checkInStatus?.late) stat.late++;
    if (hasGpsViolation(item)) stat.gpsViolation++;
  }

  const byDriver = Array.from(driverMap.values())
    .map((stat) => ({
      ...stat,
      onTimeRate:
        stat.total > 0
          ? Math.round(((stat.total - stat.late) / stat.total) * 100)
          : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // ==============================
  // Theo kho
  // ==============================
  const warehouseMap = new Map();

  for (const item of assignments) {
    const key = item.kho || "Không rõ";

    if (!warehouseMap.has(key)) {
      warehouseMap.set(key, {
        kho: key,
        total: 0,
        choXacNhan: 0,
        daXacNhan: 0,
        khongXacNhan: 0,
      });
    }

    const stat = warehouseMap.get(key);
    stat.total++;

    if (item.warehouseStatus === "Chờ xác nhận") stat.choXacNhan++;
    if (item.warehouseStatus === "Đã xác nhận") stat.daXacNhan++;
    if (item.warehouseStatus === "Không xác nhận") stat.khongXacNhan++;
  }

  const byWarehouse = Array.from(warehouseMap.values())
    .map((stat) => ({
      ...stat,
      confirmRate:
        stat.total > 0
          ? Math.round((stat.daXacNhan / stat.total) * 100)
          : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return { summary, byDriver, byWarehouse };
}

// ==============================
// GET /api/stats/report?from=&to=&kho=
// ==============================
exports.getReportStats = async (req, res) => {
  try {
    await markOverdueAssignments();

    const today = new Date().toISOString().split("T")[0];

    let { from, to, kho } = req.query;

    if (!from) from = today;
    if (!to) to = from;

    const scopedKho = getScopedKho(req);
    if (scopedKho) kho = scopedKho;

    const data = await buildReportData({ from, to, kho });

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==============================
// GET /api/stats/report/export?from=&to=&kho=
// ==============================
exports.exportReportExcel = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    let { from, to, kho } = req.query;

    if (!from) from = today;
    if (!to) to = from;

    const scopedKho = getScopedKho(req);
    if (scopedKho) kho = scopedKho;

    const { summary, byDriver, byWarehouse } = await buildReportData({
      from,
      to,
      kho,
    });

    const summaryRows = [
      { "Chỉ số": "Tổng chuyến", "Giá trị": summary.total },
      { "Chỉ số": "Hoàn thành", "Giá trị": summary.hoanThanh },
      { "Chỉ số": "Chưa hoàn thành", "Giá trị": summary.chuaHoanThanh },
      { "Chỉ số": "Trễ giờ Check In", "Giá trị": summary.late },
      { "Chỉ số": "Vi phạm GPS", "Giá trị": summary.gpsViolation },
      { "Chỉ số": "Chờ kho xác nhận", "Giá trị": summary.choXacNhan },
      { "Chỉ số": "Kho đã xác nhận", "Giá trị": summary.daXacNhan },
      { "Chỉ số": "Kho không xác nhận", "Giá trị": summary.khongXacNhan },
    ];

    const driverRows = byDriver.map((d) => ({
      "MSNV": d.msnv,
      "Họ tên": d.hoTen,
      "Tổng chuyến": d.total,
      "Hoàn thành": d.hoanThanh,
      "Trễ giờ": d.late,
      "Vi phạm GPS": d.gpsViolation,
      "Tỷ lệ đúng giờ (%)": d.onTimeRate,
    }));

    const warehouseRows = byWarehouse.map((w) => ({
      "Kho": w.kho,
      "Tổng chuyến": w.total,
      "Chờ xác nhận": w.choXacNhan,
      "Đã xác nhận": w.daXacNhan,
      "Không xác nhận": w.khongXacNhan,
      "Tỷ lệ xác nhận (%)": w.confirmRate,
    }));

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(summaryRows),
      "TongQuan"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(driverRows),
      "TheoTaiXe"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(warehouseRows),
      "TheoKho"
    );

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="bao-cao-${from}_${to}.xlsx"`
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
