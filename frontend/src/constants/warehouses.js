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

export function officialWarehouseNames(list) {
  const names = (list || [])
    .map((w) => (typeof w === "string" ? w : w?.ten || w?.name))
    .filter(Boolean);

  const official = names.filter((name) => /^Kho /i.test(name));
  const unique = [...new Set(official.length ? official : names)];

  return unique.sort((a, b) => a.localeCompare(b, "vi"));
}
