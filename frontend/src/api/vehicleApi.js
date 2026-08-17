import api from "./axios";

// Lấy danh sách xe
export const getVehicles = () => {
  return api.get("/vehicles");
};

// Thêm xe
export const createVehicle = (data) => {
  return api.post("/vehicles", data);
};

// Sửa xe
export const updateVehicle = (id, data) => {
  return api.put(`/vehicles/${id}`, data);
};

// Xóa xe
export const deleteVehicle = (id) => {
  return api.delete(`/vehicles/${id}`);
};