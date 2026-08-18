import api from "./axios";

export const getWarehouses = () => {
  return api.get("/warehouses");
};

export const updateWarehouse = (id, data) => {
  return api.put(`/warehouses/${id}`, data);
};

