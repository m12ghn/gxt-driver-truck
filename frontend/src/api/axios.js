import axios from "axios";
import { parseKhoList } from "../constants/warehouses";

const api = axios.create({
  baseURL: "/api",
  timeout: 20000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response && (err.code === "ECONNABORTED" || /timeout/i.test(err.message || ""))) {
      err.response = {
        data: {
          message:
            "Không kết nối được database (hết thời gian chờ). Kiểm tra Supabase còn chạy rồi bấm Thử lại.",
        },
      };
    }
    return Promise.reject(err);
  }
);

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.msnv) {
        config.headers["x-user-msnv"] = user.msnv;
      }
      if (user?.quyen) {
        config.headers["x-user-quyen"] = user.quyen;
      }
      const khoList = parseKhoList(user.khoList || user.kho);
      if (khoList.length) {
        config.headers["x-user-kho"] = encodeURIComponent(khoList.join("|"));
      }
    }
  } catch {
    // ignore
  }

  return config;
});

export default api;
