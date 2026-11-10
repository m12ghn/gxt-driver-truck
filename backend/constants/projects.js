const DU_AN_GXT = "GXT";
const DU_AN_VUNG_HCM = "VUNG_HCM";

function parseDuAn(value) {
  const raw = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (raw === "VUNG_HCM" || raw === "HCM" || raw === "VUNGHCM") {
    return DU_AN_VUNG_HCM;
  }
  return DU_AN_GXT;
}

function isVungHcm(duAn) {
  return parseDuAn(duAn) === DU_AN_VUNG_HCM;
}

function duAnWhere(duAn) {
  const { Op } = require("sequelize");
  if (isVungHcm(duAn)) return DU_AN_VUNG_HCM;
  return { [Op.or]: [{ duAn: DU_AN_GXT }, { duAn: null }, { duAn: "" }] };
}

module.exports = {
  DU_AN_GXT,
  DU_AN_VUNG_HCM,
  parseDuAn,
  isVungHcm,
  duAnWhere,
};
