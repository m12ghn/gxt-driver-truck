import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: true,
    host: true,
    // Proxy sang backend để FE có thể dùng đường dẫn tương đối (/api, /uploads)
    // thay vì hardcode localhost:3000 — cần thiết khi truy cập qua LAN IP
    // hoặc qua tunnel (ngrok/Cloudflare Tunnel) cho người test ở xa.
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