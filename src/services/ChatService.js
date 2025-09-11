import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8080" }); // đổi theo BE

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("idToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const sendMessageToServer = async (message, currentMovieId) => {
  const { data } = await API.post("/api/ai/chat", { message, currentMovieId });
  // data: { answer, suggestions }
  return data;
};

export const fetchWelcome = async () => {
  const { data } = await API.get("/api/ai/welcome");
  // data: { answer, suggestions, showSuggestions }
  return data;
};
