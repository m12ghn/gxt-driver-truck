// Danh sách kho mặc định + tọa độ tâm (WGS84).
// Admin có thể chỉnh lại trên trang Quản lý kho / Bản đồ GPS.
const DEFAULT_WAREHOUSES = [
  { ten: "Tân Bình", latitude: 10.8015, longitude: 106.6529, banKinh: 400 },
  { ten: "Tân Tạo", latitude: 10.7554, longitude: 106.5908, banKinh: 400 },
  { ten: "Tân Thuận", latitude: 10.7418, longitude: 106.7272, banKinh: 400 },
  { ten: "Thủ Đức", latitude: 10.8503, longitude: 106.7718, banKinh: 400 },
  { ten: "Sóng Thần", latitude: 10.9048, longitude: 106.7465, banKinh: 400 },
  { ten: "Nhà Bè", latitude: 10.6792, longitude: 106.7376, banKinh: 400 },
  { ten: "Xuyên Á", latitude: 10.8772, longitude: 106.5971, banKinh: 400 },
];

module.exports = { DEFAULT_WAREHOUSES };
