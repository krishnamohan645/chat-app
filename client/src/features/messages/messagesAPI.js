import api from "../../services/axiosInstance";

export const getMessagesAPI = (chatId, limit = 20, offset = 0) => {
  console.log(chatId, "chatId in getMessagesAPI");
  return api.get(`/chats/${chatId}/messages`, {
    params: { limit, offset },
  });
};

export const readMessagesAPI = (chatId) => {
  console.log(chatId, "chatId in readMessagesAPI");
  return api.put(`/chats/${chatId}/messages/read-all`);
};
