// Giờ bắt đầu/kết thúc từng ca làm việc.
// Cả 2 ca đều bắt đầu 7:30, chỉ khác giờ kết thúc.
// So sánh theo giờ Việt Nam (UTC+7), không phụ thuộc timezone máy.
export const SHIFT_SCHEDULE = {
  "Ca 1": { start: "07:30", end: "18:30" },
  "Ca 2": { start: "07:30", end: "19:30" },
};

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} phút`;

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
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

export function getCheckInStatus(checkInTime, ngay, ca) {
  if (!checkInTime || !ngay) return null;

  const shift = SHIFT_SCHEDULE[ca];
  if (!shift) return null;

  const shiftStart = vietnamClock(ngay, shift.start);
  if (!shiftStart) return null;

  const actual = new Date(checkInTime);
  const diffMinutes = Math.round((actual - shiftStart) / 60000);

  if (diffMinutes <= 0) {
    return { late: false, minutes: 0, label: "Đúng giờ" };
  }

  return {
    late: true,
    minutes: diffMinutes,
    label: `Trễ ${formatDuration(diffMinutes)}`,
  };
}

export function getCheckOutStatus(checkOutTime, ngay, ca) {
  if (!checkOutTime || !ngay) return null;

  const shift = SHIFT_SCHEDULE[ca];
  if (!shift) return null;

  const shiftEnd = vietnamClock(ngay, shift.end);
  if (!shiftEnd) return null;

  const actual = new Date(checkOutTime);
  const diffMinutes = Math.round((actual - shiftEnd) / 60000);

  if (diffMinutes <= 0) {
    return { late: false, minutes: 0, label: "Đúng giờ" };
  }

  return {
    late: true,
    minutes: diffMinutes,
    label: `Trễ ${formatDuration(diffMinutes)}`,
  };
}
