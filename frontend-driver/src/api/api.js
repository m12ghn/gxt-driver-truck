import axios from "axios";

// Dùng đường dẫn tương đối để đi qua Vite dev proxy (/api -> backend),
// tránh lỗi mixed-content khi trang chạy HTTPS trên điện thoại thật.
const api = axios.create({
  baseURL: "/api",
});

// Gắn token đăng nhập (nếu backend đã cấp) vào mọi request.
api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem("driverUser") || "null");
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  } catch {
    // bỏ qua
  }
  return config;
});

// Token hết hạn -> về trang đăng nhập (trừ chính request đăng nhập)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response?.status === 401 &&
      !String(err.config?.url || "").includes("/auth/") &&
      localStorage.getItem("driverUser")
    ) {
      localStorage.removeItem("driverUser");
      window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);

export default api;