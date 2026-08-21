import axios from "axios";
import { parseKhoList } from "../constants/warehouses";

const api = axios.create({
  baseURL: "/api",
});

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
        config.headers["x-user-kho"] = JSON.stringify(khoList);
      }
    }
  } catch {
    // ignore
  }

  return config;
});

export default api;
