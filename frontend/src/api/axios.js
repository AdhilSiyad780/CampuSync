import axios from "axios";

const RAW_BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const BASE = RAW_BACKEND.endsWith("/") ? RAW_BACKEND.slice(0, -1) : RAW_BACKEND;
const baseURL = BASE.endsWith("/api") ? BASE : `${BASE}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const originalRequest = error.config;

    // Check if the request explicitly asked to skip the global 401 handler
    if (status === 401 && !originalRequest._skipInterceptor) {
      
      localStorage.removeItem("user");

      // Only redirect if we aren't already heading to a login page
      const isAuthPath = window.location.pathname.includes("login") || 
                         window.location.pathname === "/";

      if (!isAuthPath) {
        console.warn("Session expired. Redirecting to login...");
        window.location.href = "/login";
      } else {
        console.warn("Unauthorized, but already on an auth-related page. No redirect needed.");
      }
    }
    return Promise.reject(error);
  }
);

export default api;