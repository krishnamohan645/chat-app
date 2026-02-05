import api from "../../services/axiosInstance";


export const getSettingsAPI = () => {
  return api.get("/settings");
};

export const updateSettingsAPI = (data) => {
  return api.patch("/settings", data);
};
