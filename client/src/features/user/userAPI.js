import api from "../../services/axiosInstance";

export const registerDeviceAPI = (data) => {
  return api.post("/user/device", data);
};

export const getMyProfileAPI = () => {
  return api.get("/user/me");
};

export const updateProfileAPI = (data) => {
  return api.put("/user/me", data);
};

export const changePasswordAPI = (data) => {
  return api.put("/user/change-password", data);
};

export const getAllUsersAPI = () => {
  return api.get("/user");
};

export const searchUsersAPI = (query) => {
  return api.get(`/user/search?search=${query}`);
};

export const getUserProfileAPI = (userId) => {
  console.log(userId, "userId in userAPI");
  return api.get(`/user/user-profile/${userId}`);
}
