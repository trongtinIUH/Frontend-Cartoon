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
  addMovieToAuthor: async (authorIds, movieId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/add-movie?authorId=${authorIds.join(",")}&movieId=${movieId}`
      );
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

   // Thêm movieId vào nhiều authors - Method này bị thiếu
  // Thêm movieId vào nhiều authors - SỬA ĐỂ MATCH VỚI BACKEND
  addMovieToMultipleAuthors: async (authorIds, movieId) => {
    try {
      console.log("Adding movie to authors:", { authorIds, movieId });
      
      // Backend expect: @RequestParam List<String> authorIds, @RequestParam String movieId
      const params = new URLSearchParams();
      
      // Thêm từng authorId vào params (Spring sẽ tự động parse thành List)
      authorIds.forEach((id) => params.append("authorIds", id));
      params.append("movieId", movieId);
      
      console.log("Request params:", params.toString());
      
      const response = await axios.post(`${API_BASE_URL}/add-movie?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("addMovieToMultipleAuthors error:", error);
      throw error.response ? error.response.data : error;
    }
  },


};

export default AuthorService;
