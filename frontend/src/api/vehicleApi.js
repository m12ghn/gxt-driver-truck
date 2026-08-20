import api from "./axios";

export const getVehicles = () => {
  return api.get("/vehicles");
};

export const createVehicle = (data) => {
  return api.post("/vehicles", data);
};

export const updateVehicle = (id, data) => {
  return api.put(`/vehicles/${id}`, data);
};

export const deleteVehicle = (id) => {
  return api.delete(`/vehicles/${id}`);
};

export const importVehicleExcel = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/vehicles/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const downloadVehicleTemplate = () => {
  return api.get("/vehicles/template", {
    responseType: "blob",
  });
};
