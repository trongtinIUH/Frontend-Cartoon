import axios from "axios";

const API_BASE_URL = "http://localhost:8080/authors";

const AuthorService = {
  // Lấy tất cả authors
  getAllAuthors: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/all`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Tạo author mới
  createAuthor: async (authorData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/create`, authorData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Thêm movieId vào author
  addMovieToAuthor: async (authorId, movieId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/add-movie?authorId=${authorId}&movieId=${movieId}`
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },
};

export default AuthorService;
