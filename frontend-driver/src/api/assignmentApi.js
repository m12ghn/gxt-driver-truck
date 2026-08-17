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
// (ODO + 6 ảnh + GPS, gửi dạng multipart/form-data)
// ==============================
export const driverCheckIn = (id, formData) => {
  return api.put(`/assignments/${id}/driver-checkin`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ==============================
// Driver Portal - Check Out
// (ODO + 6 ảnh + GPS, gửi dạng multipart/form-data)
// ==============================
export const driverCheckOut = (id, formData) => {
  return api.put(`/assignments/${id}/driver-checkout`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ==============================
// Driver Portal - Báo cáo sự cố / sửa chữa dọc đường
// ==============================
export const reportIncident = (id, formData) => {
  return api.post(`/assignments/${id}/incidents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getIncidents = (id) => {
  return api.get(`/assignments/${id}/incidents`);
};
