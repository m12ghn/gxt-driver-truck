import api from "./axios";

// ==============================
// Driver - Lấy phân công hôm nay
// ==============================
export const getTodayAssignment = (msnv) => {
  return api.get(`/assignments/today/${msnv}`);
};

// ==============================
// Admin - Danh sách phân công
// Hỗ trợ xem theo 1 ngày (ngay) hoặc khoảng ngày (from - to)
// ==============================
export const getAssignments = (from, to) => {

  const params = new URLSearchParams();

  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const query = params.toString();

  return api.get(
    `/assignments${query ? `?${query}` : ""}`
  );

};

// ==============================
// Xuất Excel danh sách phân công theo khoảng ngày
// ==============================
export const exportAssignmentExcel = (from, to) => {

  const params = new URLSearchParams();

  if (from) params.append("from", from);
  if (to) params.append("to", to);

  return api.get(
    `/assignments/export?${params.toString()}`,
    {
      responseType: "blob",
    }
  );

};

// ==============================
// Thêm phân công
// ==============================
export const createAssignment = (data) => {
  return api.post("/assignments", data);
};

// ==============================
// Check In
// ==============================
export const checkInAssignment = (id, data) => {
  return api.put(`/assignments/${id}/checkin`, data);
};

// ==============================
// Check Out
// ==============================
export const checkOutAssignment = (id, data) => {
  return api.put(`/assignments/${id}/checkout`, data);
};

// ==============================
// Admin Check Out hộ
// ==============================
export const adminCheckOutAssignment = (id, data) => {
  return api.put(`/assignments/${id}/admin-checkout`, data);
};

// ==============================
// Kho xác nhận
// ==============================
export const confirmWarehouse = (id, data) => {
  return api.put(`/assignments/${id}/warehouse-confirm`, data);
};

// ==============================
// Cập nhật phân công
// ==============================
export const updateAssignment = (id, data) => {
  return api.put(`/assignments/${id}`, data);
};

// ==============================
// Xóa phân công
// ==============================
export const deleteAssignment = (id) => {
  return api.delete(`/assignments/${id}`);
};

// ==============================
// Import Excel
// ==============================
export const importAssignmentExcel = (file) => {

  const formData = new FormData();

  formData.append("file", file);

  return api.post(
    "/upload/excel",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

};