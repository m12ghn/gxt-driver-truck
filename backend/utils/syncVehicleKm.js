const sequelize = require("../database/database");
const Vehicle = require("../models/Vehicle");

async function syncVehicleKmFromOdo(vehicleId, odo) {
  const km = Number(odo);
  if (!vehicleId || !Number.isFinite(km) || km < 0) return;

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
