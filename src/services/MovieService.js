import axios from "axios";
const API_BASE_URL = 'http://localhost:8080/movies';

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
                        'Content-Type': 'multipart/form-data'
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
}

export default MovieService;