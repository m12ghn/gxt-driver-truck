import axios from "axios";

const API = "/api/users";

// ==========================
// Danh sách User
// ==========================
export const getUsers = () => {
  return axios.get(API);
};

// ==========================
// Thêm User
// ==========================
export const createUser = (data) => {
  return axios.post(API, data);
};

// ==========================
// Cập nhật User
// ==========================
export const updateUser = (id, data) => {
  return axios.put(`${API}/${id}`, data);
};

// ==========================
// Khóa / Mở User
// ==========================
export const changeUserStatus = (id) => {
  return axios.patch(`${API}/${id}/status`);
};