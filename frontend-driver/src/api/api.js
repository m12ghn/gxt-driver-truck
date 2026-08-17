import axios from "axios";

// Dùng đường dẫn tương đối để đi qua Vite dev proxy (/api -> backend),
// tránh lỗi mixed-content khi trang chạy HTTPS trên điện thoại thật.
const api = axios.create({
  baseURL: "/api",
});

export default api;