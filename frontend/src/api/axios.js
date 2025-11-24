import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
});

const PUBLIC_URLS = [
  "/signup/send-otp/",
  "/signup/verify-otp/",
  "/signup/",
  "/superadmin/login/",
];

api.interceptors.request.use((config) => {
  // If this is a public URL → do NOT attach Authorization header
  const isPublic = PUBLIC_URLS.some((url) =>
    config.url && config.url.startsWith(url)
  );

  if (isPublic) {
    if (config.headers && config.headers.Authorization) {
      delete config.headers.Authorization;
    }
    return config;  // ✅ this return is INSIDE the function → SAFE
  }

  // Protected endpoints → attach access token
  const access = localStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }

  return config;  // always return config
});

export default api;
