import axios from "axios";
const API_BASE_URL = 'http://localhost:8080/episodes';

const EpisodeService = {
  // --- LIST BY SEASON ---
  getEpisodesBySeasonId: async (seasonId) => {
    const res = await axios.get(`${API_BASE_URL}/season/${seasonId}`);
    return res.data;
  },
  // alias cho code cũ
  getEpisodesByMovieId: async (seasonId) =>
    EpisodeService.getEpisodesBySeasonId(seasonId),

  // --- GET ONE ---
  getEpisodeBySeasonAndNumber: async (seasonId, episodeNumber) => {
    const res = await axios.get(`${API_BASE_URL}/season/${seasonId}/ep/${episodeNumber}`);
    return res.data;
  },

  // --- CREATE / UPLOAD ---
  addEpisode: async (formData) => {
    const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  // alias để khớp FE hiện gọi
  uploadEpisode: async (formData) => EpisodeService.addEpisode(formData),

  // --- COUNT BY SEASON ---
  countEpisodesBySeasonId: async (seasonId) => {
    const res = await axios.get(`${API_BASE_URL}/season/${seasonId}/count`);
    return res.data.count; // trả về số
  },
  // alias trả về object {count} nếu FE đang destructure {count}
  countBySeason: async (seasonId) => {
    const res = await axios.get(`${API_BASE_URL}/season/${seasonId}/count`);
    return res.data; // { count }
  },


  updateEpisode: async (seasonId, episodeNumber, formData) => {
    const res = await axios.put(
      `${API_BASE_URL}/season/${seasonId}/ep/${episodeNumber}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  deleteEpisode: async (seasonId, episodeNumber) => {
    const res = await axios.delete(`${API_BASE_URL}/season/${seasonId}/ep/${episodeNumber}`);
    return res.data;
  },
};

export default EpisodeService;
