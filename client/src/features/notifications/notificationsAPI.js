import api from "../../services/axiosInstance";

export const getNotificationsAPI = (page = 1, limit = 20) => {
  return api.get("/notifications", { params: { page, limit } });
};

export const markAsReadAPI = (id) => {
  return api.put(`/notifications/${id}/read`);
};

export const markAllAsReadAPI = () => {
  return api.put("/notifications/read-all");
};

export const getUnreadCountAPI = () => {
  return api.get("/notifications/unread-count");
};
