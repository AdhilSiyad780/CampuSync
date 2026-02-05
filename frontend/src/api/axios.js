import axios from "axios";

const RAW_BACKEND = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
const BASE = RAW_BACKEND.endsWith("/") ? RAW_BACKEND.slice(0, -1) : RAW_BACKEND;
const baseURL = BASE.endsWith("/api") ? BASE : `${BASE}/api`;

const api = axios.create({
  baseURL,
  // 1. MANDATORY: Allows the browser to send cookies (HttpOnly) automatically
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST interceptor
api.interceptors.request.use(
  (config) => {
    /**
     * 2. REMOVED manual Authorization header logic.
     * With HttpOnly cookies, the browser automatically attaches the 
     * 'Cookie' header to requests matching the backend domain.
     */
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    
    if (status === 401) {
      /**
       * 3. UPDATED 401 Logic.
       * You cannot "clear" HttpOnly cookies from JS. 
       * Instead, we clear the local UI-state and redirect.
       */
      localStorage.removeItem("user");
        console.warn("Session expired or unauthorized. Redirecting...");
      
      // If not on login page, redirect
      console.warn("Unauthorized request (401). Not redirecting.");
    }
    return Promise.reject(error);
  }
);

export default api;