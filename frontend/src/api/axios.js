// frontend/src/api/axios.js
import axios from "axios";

const RAW_BACKEND = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
const BASE = RAW_BACKEND.endsWith("/") ? RAW_BACKEND.slice(0, -1) : RAW_BACKEND;
// prefer backend URL to already include /api; if not, we append it
const baseURL = BASE.endsWith("/api") ? BASE : `${BASE}/api`;

const PUBLIC_URLS = [
  "/signup/send-otp/",
  "/signup/verify-otp/",
  "/superadmin/login/",
  "/auth/google-login/",
  "/login/",
];

const api = axios.create({
  baseURL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST interceptor - attach token unless the request is public
api.interceptors.request.use(
  (config) => {
    // normalize config.url to ensure it exists and is a relative path after baseURL
    const url = config.url || "";
    const isPublic = PUBLIC_URLS.some((u) => url.startsWith(u));

    if (!isPublic) {
      const access = localStorage.getItem("access");
      if (access) config.headers = { ...config.headers, Authorization: `Bearer ${access}` };
    } else {
      // ensure we don't accidentally send Authorization to public endpoints
      if (config.headers && config.headers.Authorization) {
        const { Authorization, ...rest } = config.headers;
        config.headers = rest;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE interceptor - handle 401 globally (simple behavior)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // token missing/invalid/expired — clear stored tokens so subsequent requests don't keep failing
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      // optionally: redirect user to login page - DON'T auto-redirect here to avoid hard navigation in background
      console.warn("API: 401 received, cleared tokens. You may need to login again.");
    }
    return Promise.reject(error);
  }
);

export default api;
