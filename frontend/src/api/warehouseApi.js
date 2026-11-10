import api from "./axios";

export const getWarehouses = (loai) => {
  const query = loai ? `?loai=${encodeURIComponent(loai)}` : "";
  return api.get(`/warehouses${query}`);
};

export const createWarehouse = (data) => {
  return api.post("/warehouses", data);
};

export const updateWarehouse = (id, data) => {
  return api.put(`/warehouses/${id}`, data, { timeout: 60000 });
};

