import axios from "axios";

const API_BASE_URL = 'http://localhost:8080/episodes';

const EpisodeService = {

    // Lấy tất cả tập của một bộ phim
    getEpisodesByMovieId: async (movieId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/movie/${movieId}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Lấy một tập cụ thể
    getEpisodeById: async (episodeId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/${episodeId}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
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
    }

};

export default EpisodeService;
