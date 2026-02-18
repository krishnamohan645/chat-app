import api from "../../services/axiosInstance";

export const getGroupsAPI = (data) => {
  console.log(data, "data in api");
  return api.get("/chat/list", data);
};

export const createGroupAPI = (data) => {
  return api.post("/chat/group", data);
};

export const getGroupMembersAPI = (chatId) => {
  console.log(chatId, "chatId in api group");
  return api.get(`/chat/${chatId}/members`);
};

export const addGroupMembersAPI = (chatId, members) => {
  return api.post(`/chat/${chatId}/members`, { members });
};

export const removeGroupMemberAPI = (chatId, userId) => {
  return api.delete(`/chat/${chatId}/members/${userId}`);
};

export const leaveGroupAPI = (chatId) => {
  return api.post(`/chat/${chatId}/leave`);
};
