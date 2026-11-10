// Danh sách kho GHN tên đầy đủ + GPS fallback (WGS84).
// Nếu kho đã có trong DB thì giữ nguyên tọa độ admin đã chỉnh.
const DEFAULT_WAREHOUSES = [
  {
    ten: "Kho Giao Hàng Nặng - Tân Bình - HCM",
    latitude: 10.818056,
    longitude: 106.60933,
    banKinh: 50,
  },
  {
    ten: "Kho Giao Hàng Nặng - Tân Tạo - HCM",
    latitude: 10.767202,
    longitude: 106.58264,
    banKinh: 50,
  },
  {
    ten: "Kho Giao Hàng Nặng - Tân Thuận - HCM",
    latitude: 10.751101,
    longitude: 106.73218,
    banKinh: 50,
  },
  {
    ten: "Kho Giao Hàng Nặng - Thủ Đức - HCM",
    latitude: 10.897359,
    longitude: 106.815645,
    banKinh: 50,
  },
  {
    ten: "Kho Giao Hàng Nặng - Nhà Bè - HCM",
    latitude: 10.670807,
    longitude: 106.719974,
    banKinh: 50,
  },
  {
    ten: "Kho Chuyển Tiếp Sóng Thần-Bình Dương",
    latitude: 10.880083,
    longitude: 106.747361,
    banKinh: 50,
  },
  {
    ten: "Kho Giao Hàng Nặng - Hồ Chí Minh",
    latitude: 10.8772,
    longitude: 106.5971,
    banKinh: 50,
  },
  {
    ten: "Kho Trung Chuyển Hồ Chí Minh 20",
    latitude: 10.8231,
    longitude: 106.6297,
    banKinh: 50,
  },
];

module.exports = { DEFAULT_WAREHOUSES };
