// Giờ bắt đầu/kết thúc từng ca làm việc.
export const SHIFT_SCHEDULE = {
  "Ca 1": { start: "07:30", end: "18:30" },
  "Ca 2": { start: "07:30", end: "19:30" },
};

export const SHIFT_PAY = {
  "Ca 1": 370000,
  "Ca 2": 400000,
};

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} phút`;

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}

export function getCheckInStatus(checkInTime, ngay, ca) {
  if (!checkInTime || !ngay) return null;

  const shift = SHIFT_SCHEDULE[ca];
  if (!shift) return null;

  const [h, m] = shift.start.split(":").map(Number);
  const shiftStart = new Date(`${ngay}T00:00:00`);
  shiftStart.setHours(h, m, 0, 0);

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

  const [h, m] = shift.end.split(":").map(Number);
  const shiftEnd = new Date(`${ngay}T00:00:00`);
  shiftEnd.setHours(h, m, 0, 0);

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
