// Giờ bắt đầu/kết thúc từng ca làm việc.
// Cả 2 ca đều bắt đầu 7:30, chỉ khác giờ kết thúc.
// So sánh theo Asia/Ho_Chi_Minh (UTC+7), không phụ thuộc timezone server.
const SHIFT_SCHEDULE = {
  "Ca 1": { start: "07:30", end: "18:30" },
  "Ca 2": { start: "07:30", end: "19:30" },
};

const SHIFT_PAY = {
  "Ca 1": 370000,
  "Ca 2": 400000,
};

function normalizeCa(ca) {
  const raw = String(ca || "").trim();
  if (raw === "1" || /^ca\s*1$/i.test(raw)) return "Ca 1";
  if (raw === "2" || /^ca\s*2$/i.test(raw)) return "Ca 2";
  return raw;
}

function getShiftPayroll(ca) {
  const key = normalizeCa(ca);
  const shift = SHIFT_SCHEDULE[key];
  if (!shift) {
    return {
      loai: "",
      checkIn: "",
      checkOut: "",
      caLamViec: "",
      luong: "",
    };
  }

  return {
    loai: key === "Ca 1" ? 1 : key === "Ca 2" ? 2 : "",
    checkIn: shift.start,
    checkOut: shift.end,
    caLamViec: `${shift.start}-${shift.end}`,
    luong: SHIFT_PAY[key] ?? "",
  };
}

function isoDate(ngay) {
  return String(ngay || "").slice(0, 10);
}

function vietnamClock(ngay, hhmm) {
  const day = isoDate(ngay);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !hhmm) return null;
  const [h, m] = String(hhmm).split(":");
  return new Date(
    `${day}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+07:00`
  );
}

function getShiftStart(ngay, ca) {
  const shift = SHIFT_SCHEDULE[ca];
  if (!shift) return null;
  return vietnamClock(ngay, shift.start);
}

function getShiftEnd(ngay, ca) {
  const shift = SHIFT_SCHEDULE[ca];
  if (!shift) return null;
  return vietnamClock(ngay, shift.end);
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
  SHIFT_PAY,
  normalizeCa,
  getShiftPayroll,
  vietnamClock,
  getShiftStart,
  getShiftEnd,
  getCheckInStatus,
  getMissingCheckInAlert,
};
