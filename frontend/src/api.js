import axios from "axios";

// In dev this stays as the relative "/api" and Vite proxies it to the backend
// (same-origin, no CORS). In production set VITE_API_URL to the backend URL.
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const API = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("f1_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("f1_token");
      localStorage.removeItem("f1_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default API;
