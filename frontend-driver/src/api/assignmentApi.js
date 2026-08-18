import api from "./api";

// ==============================
// Lấy phân công hôm nay theo MSNV
// ==============================
export const getTodayAssignment = (msnv) => {
  return api.get(`/assignments/today/${msnv}`);
};

// ==============================
// Lịch sử chuyến theo MSNV
// ==============================
export const getAssignmentHistory = (msnv, from, to) => {
  const params = new URLSearchParams();

  if (from) params.append("from", from);
  if (to) params.append("to", to);

  return api.get(
    `/assignments/history/${msnv}?${params.toString()}`
  );
};

// ==============================
// Check In (cũ - giữ để tương thích, không dùng cho Driver Portal nữa)
// ==============================
export const checkInAssignment = (id, data) => {
  return api.put(`/assignments/${id}/checkin`, data);
};

// ==============================
// Check Out (cũ - giữ để tương thích, không dùng cho Driver Portal nữa)
// ==============================
export const checkOutAssignment = (id, data) => {
  return api.put(`/assignments/${id}/checkout`, data);
};

// ==============================
// Driver Portal - Check In
// (JSON: ODO + GPS + URL 6 ảnh đã upload)
// ==============================
export const driverCheckIn = (id, data) => {
  return api.put(`/assignments/${id}/driver-checkin`, data);
};

// ==============================
// Driver Portal - Check Out
// ==============================
export const driverCheckOut = (id, data) => {
  return api.put(`/assignments/${id}/driver-checkout`, data);
};

// ==============================
// Driver Portal - Báo cáo sự cố / sửa chữa dọc đường
// ==============================
export const reportIncident = (id, data) => {
  return api.post(`/assignments/${id}/incidents`, data);
};

export const getIncidents = (id) => {
  return api.get(`/assignments/${id}/incidents`);
};
