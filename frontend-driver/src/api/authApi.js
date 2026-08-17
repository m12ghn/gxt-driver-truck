import api from "./api";

// ==============================
// Driver Login
// ==============================
export const driverLogin = (msnv, matKhau) => {
  return api.post("/auth/driver-login", {
    msnv,
    matKhau,
  });
};
