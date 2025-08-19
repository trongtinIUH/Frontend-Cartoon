import axios from "axios";
const API_BASE_URL = "http://localhost:8080/seasons";

const SeasonService = {
  // Tạo season mới cho movie
  createSeason: async ({ movieId, seasonNumber, title, description, releaseYear, posterUrl }) => {
    const params = new URLSearchParams();
    params.append("movieId", movieId);
    params.append("seasonNumber", seasonNumber);
    if (title) params.append("title", title);
    if (description) params.append("description", description);
    if (releaseYear) params.append("releaseYear", releaseYear);
    if (posterUrl) params.append("posterUrl", posterUrl);

    const res = await axios.post(`${API_BASE_URL}/create?${params.toString()}`);
    return res.data;
  },

  // List seasons theo movie
  getSeasonsByMovie: async (movieId) => {
    const res = await axios.get(`${API_BASE_URL}/movie/${movieId}`);
    return res.data;
  },

  // Lấy một season theo (movieId, seasonNumber)
  getSeason: async (movieId, seasonNumber) => {
    const res = await axios.get(`${API_BASE_URL}/movie/${movieId}/number/${seasonNumber}`);
    return res.data;
  },

  deleteSeason: async (movieId, seasonNumber) => {
    const res = await axios.delete(`${API_BASE_URL}/movie/${movieId}/number/${seasonNumber}`);
    return res.data;
  },
};

export default SeasonService;
