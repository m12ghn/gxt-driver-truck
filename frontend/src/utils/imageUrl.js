// Backend phục vụ file tĩnh tại /uploads. Để trống (đường dẫn tương đối)
// để tự động đi qua proxy /uploads của Vite dev server — hoạt động đúng
// dù truy cập qua localhost, LAN IP, hay qua tunnel (ngrok/Cloudflare Tunnel).
export const BACKEND_ORIGIN = "";

export function buildImageUrl(path) {
  if (!path) return null;

  return `${BACKEND_ORIGIN}${path}`;
}

// Nhãn hiển thị cho 6 ảnh chụp real-time từ Driver Portal.
export const DRIVER_PHOTO_LABELS = {
  matTruoc: "Mặt trước xe",
  matSau: "Mặt sau xe",
  hongTrai: "Hông trái xe",
  hongPhai: "Hông phải xe",
  banhSoCua: "Bánh sơ cua",
  manOdo: "Màn hình ODO",
};
