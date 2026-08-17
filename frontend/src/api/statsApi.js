import api from "./axios";

export const getDashboardStats = () => {
  return api.get("/stats/dashboard");
};

export const getAlerts = () => {
  return api.get("/stats/alerts");
};

export const getReportStats = (from, to, kho) => {
  const params = new URLSearchParams();

  if (from) params.append("from", from);
  if (to) params.append("to", to);
  if (kho) params.append("kho", kho);

  return api.get(`/stats/report?${params.toString()}`);
};

export const exportReportExcel = (from, to, kho) => {
  const params = new URLSearchParams();

  if (from) params.append("from", from);
  if (to) params.append("to", to);
  if (kho) params.append("kho", kho);

  return api.get(`/stats/report/export?${params.toString()}`, {
    responseType: "blob",
  });
};
