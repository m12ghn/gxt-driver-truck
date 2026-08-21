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

function knownKhoNames() {
  return [
    ...warehouses,
    ...Object.keys(SHORT_BY_OFFICIAL),
    ...Object.values(SHORT_BY_OFFICIAL),
  ];
}

function recoverKhoNames(raw) {
  const text = String(raw || "");
  const found = [];

  for (const match of text.matchAll(/"([^"]+)"/g)) {
    const name = String(match[1] || "").trim();
    if (name.startsWith("Kho ") || SHORT_BY_OFFICIAL[name]) found.push(name);
  }

  const known = knownKhoNames().sort((a, b) => b.length - a.length);
  for (const name of known) {
    if (name && text.includes(name)) found.push(name);
  }

  return uniqueNames(found);
}

function uniqueNames(list) {
  return [
    ...new Set(
      (list || [])
        .map((item) => String(item || "").trim())
        .filter((name) => name && !name.startsWith("[") && name !== "__NO_KHO__")
    ),
  ];
}

export function parseKhoList(kho) {
  if (Array.isArray(kho)) {
    const out = [];
    for (const item of kho) {
      if (item == null || item === "") continue;
      if (Array.isArray(item)) {
        out.push(...parseKhoList(item));
        continue;
      }
      const s = String(item).trim();
      if (!s) continue;
      if (s.startsWith("[") || s.startsWith("\"") || s.includes("|")) {
        out.push(...parseKhoList(s));
      } else {
        out.push(s);
      }
    }
    return uniqueNames(out);
  }

  const raw = String(kho || "").trim();
  if (!raw) return [];

  if (raw.startsWith("[") || raw.startsWith("\"")) {
    try {
      let parsed = JSON.parse(raw);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      if (Array.isArray(parsed)) return parseKhoList(parsed);
    } catch {
      const recovered = recoverKhoNames(raw);
      if (recovered.length) return recovered;
    }
  }

  if (raw.includes("|")) {
    return parseKhoList(raw.split("|"));
  }

  if (raw.startsWith("[")) return recoverKhoNames(raw);

  return uniqueNames([raw]);
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
