import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// HTTPS (chứng chỉ tự ký) + host LAN để test camera/GPS
// từ điện thoại thật qua wifi cùng mạng với máy chạy dev server.
export default defineConfig({
  plugins: [
    react(),
    // Thêm IP LAN vào chứng chỉ để điện thoại truy cập bằng
    // https://<IP LAN>:5174 không bị từ chối vì sai domain.
    basicSsl({
      name: "gxt-driver",
      domains: ["localhost", "192.168.0.174"],
    }),
  ],

  server: {
    port: 5174,
    strictPort: true,
    host: true,
    // Proxy sang backend (http) để trang HTTPS không bị chặn
    // mixed-content khi gọi API/tải ảnh từ điện thoại thật.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});