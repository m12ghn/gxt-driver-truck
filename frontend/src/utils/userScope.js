import { parseKhoList } from "../constants/warehouses";
import { DU_AN_GXT, DU_AN_VUNG_HCM } from "../constants/projects";

export function parseLoaiViTri(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (raw === "BUU_CUC") return "BUU_CUC";
  if (raw === "KHO") return "KHO";
  return "";
}

export function isLocationScoped(user) {
  const quyen = String(user?.quyen || "").toUpperCase();
  if (quyen === "SUPER_ADMIN" || quyen === "DRIVER") return false;
  if (quyen === "WAREHOUSE") return true;
  if (quyen === "ADMIN") {
    return parseKhoList(user?.khoList || user?.kho).length > 0;
  }
  return false;
}

export function userLoaiViTri(user) {
  return parseLoaiViTri(user?.loaiViTri);
}

export function canOpenGxt(user) {
  if (!isLocationScoped(user)) return true;
  return userLoaiViTri(user) !== "BUU_CUC";
}

export function canOpenHcm(user) {
  if (!isLocationScoped(user)) return true;
  return userLoaiViTri(user) !== "KHO";
}

export function homePath(user) {
  if (!isLocationScoped(user)) return "/dashboard";
  return userLoaiViTri(user) === "BUU_CUC" ? "/assignments-hcm" : "/assignments";
}

export function assignmentDuAnForUser(user) {
  return userLoaiViTri(user) === "BUU_CUC" ? DU_AN_VUNG_HCM : DU_AN_GXT;
}
