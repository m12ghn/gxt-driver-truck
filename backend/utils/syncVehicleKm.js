const sequelize = require("../database/database");
const Vehicle = require("../models/Vehicle");

// Km hiện tại = ODO Check Out (không có thì Check In) của chuyến
// **ngày phân công gần nhất**. Không lấy lần bấm Check In/Out mới nhất,
// để Check Out hộ / Check In ngày cũ không ghi đè km ngày mới hơn.

async function syncVehicleKmFromOdo(vehicleId) {
  if (!vehicleId) return;

  const [rows] = await sequelize.query(
    `
    SELECT CAST(COALESCE("odoCheckOut", "odoCheckIn") AS INTEGER) AS odo
    FROM "Assignments"
    WHERE "vehicleId" = :vehicleId
      AND ("odoCheckOut" IS NOT NULL OR "odoCheckIn" IS NOT NULL)
    ORDER BY
      "ngay" DESC NULLS LAST,
      COALESCE("checkOutTime", "checkInTime") DESC NULLS LAST,
      "id" DESC
    LIMIT 1
    `,
    { replacements: { vehicleId } }
  );

  const km = Number(rows?.[0]?.odo);
  if (!Number.isFinite(km) || km < 0) return;

  await Vehicle.update(
    { kmHienTai: Math.round(km) },
    { where: { id: vehicleId } }
  );
}

let backfilled = false;

async function backfillVehicleKmFromAssignments() {
  if (backfilled) return;

  await sequelize.query(`
    UPDATE "Vehicles" AS v
    SET "kmHienTai" = sub.odo
    FROM (
      SELECT DISTINCT ON ("vehicleId")
        "vehicleId",
        CAST(COALESCE("odoCheckOut", "odoCheckIn") AS INTEGER) AS odo
      FROM "Assignments"
      WHERE "odoCheckOut" IS NOT NULL OR "odoCheckIn" IS NOT NULL
      ORDER BY
        "vehicleId",
        "ngay" DESC NULLS LAST,
        COALESCE("checkOutTime", "checkInTime") DESC NULLS LAST,
        "id" DESC
    ) AS sub
    WHERE v.id = sub."vehicleId"
      AND sub.odo IS NOT NULL
  `);

  backfilled = true;
}

module.exports = {
  syncVehicleKmFromOdo,
  backfillVehicleKmFromAssignments,
};
