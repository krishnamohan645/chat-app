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

export const searchMessagesAPI = (chatId, query) => {
  console.log(chatId, "chatId in searchMessagesAPI");
  console.log(query, "query in searchMessagesAPI");

  return api.get(`/chats/${chatId}/messages/search`, {
    params: { search: query },
  });
};

export const sendMessageAPI = (chatId, content) => {
  return api.post(`/chats/${chatId}/messages`, { content });
};

export const deleteMessageForEveryoneAPI = ({ chatId, messageId }) => {
  console.log(messageId, "messageId in deleteMessageForEveryoneAPI");
  return api.delete(`/chats/${chatId}/messages/${messageId}`);
};

export const deleteMessageForMeAPI = ({ chatId, messageId }) => {
  console.log(messageId, "messageId in deleteMessageForMeAPI");
  return api.delete(`/chats/${chatId}/messages/${messageId}/me`);
};

export const editMessageAPI = ({ chatId, messageId, content }) => {
  console.log(messageId, chatId, content, " in editMessageAPI");
  return api.put(`/chats/${chatId}/messages/${messageId}`, { content });
};

export const sendFileMessageAPI = (chatId, files) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("file", file);
  });

  return api.post(`/chats/${chatId}/messages/media`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const sendStickerAPI = (chatId, stickerUrl) => {
  return api.post(`/chats/${chatId}/messages/sticker`, {
    stickerUrl,
  });
};
