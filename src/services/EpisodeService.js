import axios from "axios";
import axiosInstance from "../api/axiosInstance";

const API_BASE_URL = 'http://localhost:8080/episodes';

const EpisodeService = {

    // Lấy tất cả tập của một bộ phim //sửa lại  thành getEpisodesBySeasonId
    getEpisodesByMovieId: async (seasonId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/season/${seasonId}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },


    // Lấy 1 tập theo composite key
    getEpisodeBySeasonAndNumber: async (seasonId, episodeNumber) => {
        const res = await axios.get(`${API_BASE_URL}/season/${seasonId}/ep/${episodeNumber}`);
        return res.data;
    },

    // Thêm mới một tập phim (video + thông tin)
    addEpisode: async (episodeData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/upload`, episodeData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Xoá một tập phim
    deleteEpisode: async (episodeId) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/${episodeId}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Cập nhật tập phim
    updateEpisode: async (episodeId, updatedData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/${episodeId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    //số tập của một bộ phim
    countEpisodesByMovieId: async (movieId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/count/${movieId}`);
            return response.data.count; // Giả sử API trả về { count: số_tập }
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

      // Đếm tập theo season
    countEpisodesBySeasonId: async (seasonId) => {
        const res = await axios.get(`${API_BASE_URL}/season/${seasonId}/count`);
        return res.data.count;
    },


};

export default EpisodeService;
