// Giờ bắt đầu/kết thúc từng ca làm việc.
// Cả 2 ca đều bắt đầu 7:30, chỉ khác giờ kết thúc.
// (Bản sao của frontend/src/utils/shiftHelpers.js, dùng cho tính
// toán thống kê ở server để Dashboard/Report không phải tính lại ở FE.)
const SHIFT_SCHEDULE = {
  "Ca 1": { start: "07:30", end: "18:30" },
  "Ca 2": { start: "07:30", end: "19:30" },
};

function getShiftStart(ngay, ca) {
  const shift = SHIFT_SCHEDULE[ca];
  if (!shift || !ngay) return null;

  const [h, m] = shift.start.split(":").map(Number);
  const shiftStart = new Date(`${ngay}T00:00:00`);
  shiftStart.setHours(h, m, 0, 0);
  return shiftStart;
}

function getCheckInStatus(checkInTime, ngay, ca) {
  if (!checkInTime || !ngay) return null;

  const shiftStart = getShiftStart(ngay, ca);
  if (!shiftStart) return null;

  const actual = new Date(checkInTime);
  const diffMinutes = Math.round((actual - shiftStart) / 60000);

  if (diffMinutes <= 0) {
    return { late: false, minutes: 0 };
  }

  return { late: true, minutes: diffMinutes };
}

// Cảnh báo "Chưa Check In": từ phút thứ 1 sau giờ vào ca (07:31)
// nếu chuyến vẫn chưa có checkInTime.
function getMissingCheckInAlert(ngay, ca, checkInTime, now = new Date()) {
  if (checkInTime) return null;

  const shiftStart = getShiftStart(ngay, ca);
  if (!shiftStart) return null;

  const alertFrom = new Date(shiftStart.getTime() + 60 * 1000);
  if (now < alertFrom) return null;

  const minutes = Math.round((now - shiftStart) / 60000);

  return {
    missing: true,
    minutes: Math.max(minutes, 1),
    shiftStartLabel: "7:30",
  };
}

module.exports = {
  SHIFT_SCHEDULE,
  getCheckInStatus,
  getMissingCheckInAlert,
};
