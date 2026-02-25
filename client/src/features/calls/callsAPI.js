import api from "../../services/axiosInstance";

export const getCallHistoryAPI = (page = 1, limit = 20, filters = {}) => {
  const params = { page, limit, ...filters };
  return api.get("/calls/history", { params });
};

export const getMissedCallsAPI = (page = 1, limit = 20) => {
  return api.get("/calls/missed", { params: { page, limit } });
};

export const getMissedCallsCountAPI = () => {
  return api.get("/calls/missed/count");
};

export const getCallDetailsAPI = (callId) => {
  return api.get(`/calls/${callId}`);
};

export const deleteCallAPI = (callId) => {
  return api.delete(`/calls/${callId}`);
};

export const clearCallHistoryAPI = (type = "all") => {
  return api.delete("/calls/clear", { params: { type } });
};

export const getCallStatsAPI = () => {
  return api.get("/calls/stats");
};
