import api from "../../services/axiosInstance";

export const registerAPI = (data) => {
  return api.post("/auth/register", data);
};

export const verifyOtpAPI = (data) => {
  return api.post("/auth/verify-otp", data);
};

export const resendOtpAPI = (data) => {
  return api.post("/auth/resend-otp", data);
};

export const loginAPI = (data) => {
  return api.post("/auth/login", data);
};

export const logoutAPI = () => {
  return api.post("/auth/logout");
};

export const refreshAPI = () => {
  return api.post("/auth/refresh");
};

export const forgotPasswordAPI = (data) => {
  return api.post("/auth/forgot-password", data);
};

export const resetPasswordAPI = (data) => {
  return api.post("/auth/reset-password", data);
};
