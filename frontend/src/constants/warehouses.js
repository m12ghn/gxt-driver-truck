export const warehouses = [
  "Kho Giao Hàng Nặng - Tân Bình - HCM",
  "Kho Giao Hàng Nặng - Tân Tạo - HCM",
  "Kho Giao Hàng Nặng - Tân Thuận - HCM",
  "Kho Giao Hàng Nặng - Thủ Đức - HCM",
  "Kho Chuyển Tiếp Sóng Thần-Bình Dương",
  "Kho Giao Hàng Nặng - Nhà Bè - HCM",
  "Kho Trung Chuyển Hồ Chí Minh 01",
  "Kho Trung Chuyển Hồ Chí Minh 20",
];

const SHORT_BY_OFFICIAL = {
  "Kho Giao Hàng Nặng - Tân Bình - HCM": "Tân Bình",
  "Kho Giao Hàng Nặng - Tân Tạo - HCM": "Tân Tạo",
  "Kho Giao Hàng Nặng - Tân Thuận - HCM": "Tân Thuận",
  "Kho Giao Hàng Nặng - Thủ Đức - HCM": "Thủ Đức",
  "Kho Giao Hàng Nặng - Nhà Bè - HCM": "Nhà Bè",
  "Kho Chuyển Tiếp Sóng Thần-Bình Dương": "Sóng Thần",
  "Kho Trung Chuyển Hồ Chí Minh 01": "Xuyên Á",
  "Kho Trung Chuyển Hồ Chí Minh 20": "HCM 20",
};

export function officialWarehouseNames(list) {
  const names = (list || [])
    .map((w) => (typeof w === "string" ? w : w?.ten || w?.name))
    .filter(Boolean);

  const official = names.filter((name) => /^Kho /i.test(name));
  const unique = [...new Set(official.length ? official : names)];

  return unique.sort((a, b) => a.localeCompare(b, "vi"));
}

export function parseKhoList(kho) {
  if (Array.isArray(kho)) {
    return [...new Set(kho.map((item) => String(item || "").trim()).filter(Boolean))];
  }

  const raw = String(kho || "").trim();
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parseKhoList(parsed);
    } catch {
      // keep falling through
    }
  }

  if (raw.includes("|")) {
    return parseKhoList(raw.split("|"));
  }

  return [raw];
}

export function shortKhoName(name) {
  const n = String(name || "").trim();
  return SHORT_BY_OFFICIAL[n] || n;
}

export function formatKhoLabel(kho) {
  return parseKhoList(kho).map(shortKhoName).join(" · ");
}

export function khoMatches(itemKho, filterKho) {
  if (!filterKho) return true;
  const itemNames = parseKhoList(itemKho).map(shortKhoName);
  const filterNames = parseKhoList(filterKho).map(shortKhoName);
  return itemNames.some((name) => filterNames.includes(name));
}
