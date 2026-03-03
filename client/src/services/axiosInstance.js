// src/services/axiosInstance.js
import axios from "axios";

const api = axios.create({
  // baseURL: "http://localhost:5000/api",
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

// ✅ Function to set/clear Authorization header
export const setAxiosToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    console.log("🔑 Axios token set:", token.substring(0, 20) + "...");
  } else {
    delete api.defaults.headers.common.Authorization;
    console.log("🔓 Axios token cleared");
  }
};

// ✅ Store reference (set later by store.js)
let storeReference = null;

export const setStoreReference = (store) => {
  storeReference = store;
  console.log("✅ Store reference set in axios");
};

// ✅ Response interceptor for token refresh
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Don't retry /auth/refresh itself
    if (originalRequest.url.includes("/auth/refresh")) {
      return Promise.reject(err);
    }

    // If 401 and haven't retried
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("🔄 Token expired, refreshing...");
        const res = await api.post("/auth/refresh");
        const newToken = res.data.accessToken;

        // Update Redux store
        if (storeReference) {
          const { setAccessToken } = await import("../features/auth/authSlice");
          storeReference.dispatch(setAccessToken(newToken));
        }

        // Update Axios headers
        setAxiosToken(newToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        console.log("✅ Token refreshed, retrying request");
        return api(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed, logging out");

        // Logout user
        if (storeReference) {
          const { logoutLocal } = await import("../features/auth/authSlice");
          storeReference.dispatch(logoutLocal());
        }

        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  },
);

export default api;
