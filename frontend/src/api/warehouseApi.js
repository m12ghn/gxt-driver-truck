import api from "./axios";

export const getWarehouses = () => {
  return api.get("/warehouses");
};

export const createWarehouse = (data) => {
  return api.post("/warehouses", data);
};

export const updateWarehouse = (id, data) => {
  return api.put(`/warehouses/${id}`, data);
};

