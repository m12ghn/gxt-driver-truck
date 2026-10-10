const sequelize = require("../database/database");
const Vehicle = require("../models/Vehicle");
const { assignmentDateText } = require("./assignmentHelpers");

const MAX_DAILY_KM = 100;

function isConfirmed(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function parseOdo(value) {
  const km = Number(value);
  if (!Number.isFinite(km) || km < 0) return null;
  return Math.round(km);
}

function fail(status, body) {
  return { ok: false, status, body: { success: false, ...body } };
}

async function findPreviousOdo(vehicleId, ngay) {
  if (!vehicleId || !ngay) return null;

  const [rows] = await sequelize.query(
    `
    SELECT CAST(COALESCE("odoCheckOut", "odoCheckIn") AS INTEGER) AS odo
    FROM "Assignments"
    WHERE "vehicleId" = :vehicleId
      AND "ngay" < :ngay
      AND ("odoCheckOut" IS NOT NULL OR "odoCheckIn" IS NOT NULL)
    ORDER BY
      "ngay" DESC NULLS LAST,
      COALESCE("checkOutTime", "checkInTime") DESC NULLS LAST,
      "id" DESC
    LIMIT 1
    `,
    { replacements: { vehicleId, ngay } }
  );

  const odo = Number(rows?.[0]?.odo);
  return Number.isFinite(odo) ? odo : null;
}

async function getVehicleKm(vehicleId) {
  if (!vehicleId) return null;
  const vehicle = await Vehicle.findByPk(vehicleId, {
    attributes: ["kmHienTai"],
  });
  const km = Number(vehicle?.kmHienTai);
  return Number.isFinite(km) && km > 0 ? km : null;
}

async function validateCheckInOdo({ vehicleId, ngay, odo }) {
  const value = parseOdo(odo);
  if (value == null) {
    return fail(400, { message: "Số ODO không hợp lệ." });
  }

  const lastOdo =
    (await findPreviousOdo(vehicleId, assignmentDateText(ngay))) ??
    (await getVehicleKm(vehicleId));
  if (lastOdo != null && value <= lastOdo) {
    return fail(400, {
      message: `Số ODO phải lớn hơn ODO gần nhất của xe (${lastOdo}). Vui lòng kiểm tra lại đồng hồ ODO.`,
      lastOdo,
    });
  }

  return { ok: true, odo: value };
}

async function validateCheckOutOdo({
  vehicleId,
  ngay,
  odoCheckIn,
  odoCheckOut,
  confirmAbnormal,
}) {
  const checkIn = parseOdo(odoCheckIn);
  const checkOut = parseOdo(odoCheckOut);

  if (checkIn == null) {
    return fail(400, { message: "Chuyến này chưa có ODO Check In hợp lệ." });
  }

  if (checkOut == null) {
    return fail(400, { message: "Số ODO không hợp lệ." });
  }

  if (checkOut <= checkIn) {
    return fail(400, {
      message: `ODO Check Out phải lớn hơn ODO Check In (${checkIn}). Vui lòng kiểm tra lại đồng hồ ODO.`,
      odoCheckIn: checkIn,
    });
  }

  const lastOdo = await findPreviousOdo(vehicleId, assignmentDateText(ngay));
  if (lastOdo != null && checkOut <= lastOdo) {
    return fail(400, {
      message: `Số ODO phải lớn hơn ODO gần nhất của xe (${lastOdo}). Vui lòng kiểm tra lại đồng hồ ODO.`,
      lastOdo,
    });
  }

  const km = checkOut - checkIn;
  if (km > MAX_DAILY_KM && !isConfirmed(confirmAbnormal)) {
    return fail(409, {
      needConfirmOdo: true,
      km,
      odoCheckIn: checkIn,
      odoCheckOut: checkOut,
      maxDailyKm: MAX_DAILY_KM,
      message: `ODO bất thường: chuyến này phát sinh ${km} km (Check In ${checkIn} → Check Out ${checkOut}), vượt ${MAX_DAILY_KM} km/ngày. Vui lòng kiểm tra lại đồng hồ ODO. Nếu số đúng, xác nhận để hoàn thành.`,
    });
  }

  return { ok: true, odo: checkOut, km };
}

module.exports = {
  MAX_DAILY_KM,
  isConfirmed,
  parseOdo,
  validateCheckInOdo,
  validateCheckOutOdo,
};
