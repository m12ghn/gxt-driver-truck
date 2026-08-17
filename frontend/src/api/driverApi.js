import api from "./axios";

// ==============================
// Danh sách tài xế
// ==============================
export const getDrivers = () => {
  return api.get("/drivers");
};

// ==============================
// Chi tiết tài xế
// ==============================
export const getDriver = (id) => {
  return api.get(`/drivers/${id}`);
};

// ==============================
// Thêm tài xế
// ==============================
export const createDriver = (data) => {
  return api.post("/drivers", data);
};

// ==============================
// Cập nhật tài xế
// ==============================
export const updateDriver = (id, data) => {
  return api.put(`/drivers/${id}`, data);
};

// ==============================
// Khóa / Mở tài xế
// ==============================
export const changeDriverStatus = (id) => {
  return api.patch(`/drivers/${id}/status`);
};

// ==============================
// Xóa tài xế
// ==============================
export const deleteDriver = (id) => {
  return api.delete(`/drivers/${id}`);
};