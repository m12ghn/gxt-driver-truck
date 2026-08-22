const { Op } = require("sequelize");
const Assignment = require("../models/Assignment");
const Warehouse = require("../models/Warehouse");
const { getDistanceMeters } = require("./geoHelpers");
const {
  findWarehouseByName,
  getKhoNameVariants,
} = require("./ensureWarehouses");

function isValidCoord(lat, lng) {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}

function gpsFieldsForPoint(lat, lng, warehouse) {
  const distance = getDistanceMeters(
    Number(lat),
    Number(lng),
    Number(warehouse.latitude),
    Number(warehouse.longitude)
  );

  if (!Number.isFinite(distance)) return null;

  const radius = Number(warehouse.banKinh);
  return {
    distance,
    gpsValid: Number.isFinite(radius) && distance <= radius,
  };
}

function buildGpsPatch(assignment, warehouse) {
  if (!warehouse || !isValidCoord(warehouse.latitude, warehouse.longitude)) {
    return null;
  }

  const patch = {};

  if (isValidCoord(assignment.checkInLatitude, assignment.checkInLongitude)) {
    const result = gpsFieldsForPoint(
      assignment.checkInLatitude,
      assignment.checkInLongitude,
      warehouse
    );
    if (result) {
      patch.checkInDistanceMeters = result.distance;
      patch.checkInGpsValid = result.gpsValid;
    }
  }

  if (isValidCoord(assignment.checkOutLatitude, assignment.checkOutLongitude)) {
    const result = gpsFieldsForPoint(
      assignment.checkOutLatitude,
      assignment.checkOutLongitude,
      warehouse
    );
    if (result) {
      patch.checkOutDistanceMeters = result.distance;
      patch.checkOutGpsValid = result.gpsValid;
    }
  }

  return Object.keys(patch).length ? patch : null;
}

async function updateAssignmentGps(assignment, warehouse) {
  const patch = buildGpsPatch(assignment, warehouse);
  if (!patch) return false;

  const sameIn =
    patch.checkInGpsValid === undefined ||
    assignment.checkInGpsValid === patch.checkInGpsValid;
  const sameOut =
    patch.checkOutGpsValid === undefined ||
    assignment.checkOutGpsValid === patch.checkOutGpsValid;

  if (sameIn && sameOut) {
    const distanceUnchanged =
      (patch.checkInDistanceMeters == null ||
        Number(assignment.checkInDistanceMeters) ===
          Number(patch.checkInDistanceMeters)) &&
      (patch.checkOutDistanceMeters == null ||
        Number(assignment.checkOutDistanceMeters) ===
          Number(patch.checkOutDistanceMeters));
    if (distanceUnchanged) return false;
  }

  await assignment.update(patch);
  return true;
}

async function syncSiblingWarehouseCoords(warehouse, coords) {
  const variants = getKhoNameVariants(warehouse.ten).filter(
    (name) => name !== warehouse.ten
  );
  if (!variants.length) return;

  await Warehouse.update(coords, {
    where: { ten: { [Op.in]: variants } },
  });
}

async function recalculateAssignmentGpsForWarehouse(warehouse) {
  if (!warehouse) return 0;

  const variants = getKhoNameVariants(warehouse.ten);
  const assignments = await Assignment.findAll({
    where: {
      kho: variants.length > 1 ? { [Op.in]: variants } : warehouse.ten,
      [Op.or]: [
        { checkInLatitude: { [Op.ne]: null } },
        { checkOutLatitude: { [Op.ne]: null } },
      ],
    },
  });

  let updated = 0;
  for (const item of assignments) {
    if (await updateAssignmentGps(item, warehouse)) updated += 1;
  }
  return updated;
}

async function recalculateAllAssignmentGps() {
  const assignments = await Assignment.findAll({
    where: {
      [Op.or]: [
        { checkInLatitude: { [Op.ne]: null } },
        { checkOutLatitude: { [Op.ne]: null } },
      ],
    },
  });

  const cache = new Map();
  let updated = 0;

  for (const item of assignments) {
    const key = String(item.kho || "");
    if (!cache.has(key)) {
      cache.set(key, await findWarehouseByName(key));
    }
    const warehouse = cache.get(key);
    if (!warehouse) continue;
    if (await updateAssignmentGps(item, warehouse)) updated += 1;
  }

  return updated;
}

module.exports = {
  recalculateAssignmentGpsForWarehouse,
  recalculateAllAssignmentGps,
  syncSiblingWarehouseCoords,
};
