import api from "../../services/axiosInstance";

export const createPrivateChatAPI = (userId) => {
  return api.post("/chat/private", { userId });
};

export const getMyChatsAPI = (limit = 20) => {
  return api.get("/chat", { params: { limit } });
};

export const getChatListAPI = () => {
  return api.get("/chat/list");
};
