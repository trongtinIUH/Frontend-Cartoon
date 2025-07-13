import axios from "axios";
const API_BASE_URL = 'http://localhost:8080/movies';
const token = localStorage.getItem("idToken");
const MovieService = {

    //get all movies
    getAllMovies: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/all`);
            response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    //get movie by id
    getMovieById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    //add new movie
    createMovie: async (movieData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/create`, movieData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                //        "Authorization": `Bearer ${token}`
                    }
                }
            );
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    //xóa nhìu movie
    deleteMovies: async (ids) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/delete`, { data: ids });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    //update movie
    updateMovie: async (movieId,movieData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/${movieId}/update`, movieData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    //tìm phim theo genres
    getMoviesByGenre: async (genre) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/genre/${genre}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    //tìm phim theo title gần đúng
    searchMovies: async (title) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/search`, { params: { title } });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
    
    //lọc phim theo năm va tháng
    filterMoviesByYearAndMonth: async (year, month) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/filter`, { params: { year, month } });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    //tăng view count
    incrementViewCount: async (movieId) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/${movieId}/increment-view`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    //top 10 phim nổi bật
    getPopularMovies: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/popular`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
    //top nhưng phim mới nhất ... chưa làm BE FE


}

export default MovieService;