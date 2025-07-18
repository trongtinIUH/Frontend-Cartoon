// src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("idToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

export default axiosInstance;
