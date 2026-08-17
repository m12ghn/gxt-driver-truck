import api from "./axios";

export const getWarehouses = () => {
  return api.get("/warehouses");
};
