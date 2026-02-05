import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("AXIOS TOKEN:", token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshRes = await api.post("/auth/refresh");
        localStorage.setItem("token", refreshRes.data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${refreshRes.data.accessToken}`;

        return api(originalRequest);
      } catch {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export default api;
