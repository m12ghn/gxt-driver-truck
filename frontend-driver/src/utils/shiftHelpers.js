// Giờ bắt đầu/kết thúc từng ca làm việc.
export const SHIFT_SCHEDULE = {
  "Ca 1": { start: "07:30", end: "18:30" },
  "Ca 2": { start: "07:30", end: "19:30" },
};

export const SHIFT_PAY = {
  "Ca 1": 370000,
  "Ca 2": 400000,
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

export function vietnamDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type) =>
    Number(parts.find((part) => part.type === type)?.value || 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
}

export function lastDayOfMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function getPayPeriodRange(year, month, ky) {
  const last = lastDayOfMonth(year, month);
  const mm = pad2(month);

  if (Number(ky) === 1) {
    return {
      from: `${year}-${mm}-01`,
      to: `${year}-${mm}-15`,
    };
  }

  return {
    from: `${year}-${mm}-16`,
    to: `${year}-${mm}-${pad2(last)}`,
  };
}

export function currentPayPeriod() {
  const { year, month, day } = vietnamDateParts();
  return {
    year,
    month,
    ky: day <= 15 ? 1 : 2,
  };
}

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
