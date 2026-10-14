import api from "./axios";

function dashboardParams(from, to, kho) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  if (kho) params.append("kho", kho);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const getDashboardStats = (from, to, kho) => {
  return api.get(`/stats/dashboard${dashboardParams(from, to, kho)}`);
};

export const getAlerts = (from, to, kho) => {
  return api.get(`/stats/alerts${dashboardParams(from, to, kho)}`);
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
