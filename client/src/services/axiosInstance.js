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
// ✅ FIXED VERSION:
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const status = err.response?.status;

    // ⚠️ If refresh endpoint fails with 401/403, logout immediately
    if (originalRequest.url.includes("/auth/refresh")) {
      if (status === 401 || status === 403) {
        console.error("❌ Refresh token invalid, logging out");

        if (storeReference) {
          const { logoutLocal } = await import("../features/auth/authSlice");
          storeReference.dispatch(logoutLocal());
        }

        window.location.href = "/login";
      }

      // For 500 errors, just reject without logout
      return Promise.reject(err);
    }

    // If 401 on normal request and haven't retried
    if (status === 401 && !originalRequest._retry) {
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
        const refreshStatus = refreshError.response?.status;

        // Only logout on auth errors, not server errors
        if (refreshStatus === 401 || refreshStatus === 403) {
          console.error("❌ Token refresh failed (auth error), logging out");

          if (storeReference) {
            const { logoutLocal } = await import("../features/auth/authSlice");
            storeReference.dispatch(logoutLocal());
          }

          window.location.href = "/login";
        } else {
          console.error(
            "❌ Token refresh failed (server error):",
            refreshError,
          );
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  },
);

export default api;
