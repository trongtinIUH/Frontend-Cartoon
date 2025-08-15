import axiosInstance from "../api/axiosInstance";

const API_BASE_URL = 'http://localhost:8080/wishlist';

const WishlistService = {
    // thêm phim vào danh sách yêu thích
  addToWishlist: async (userId, movieId) => {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/add`, {
          userId,
          movieId,
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  },

  // Xóa phim khỏi danh sách yêu thích
  removeFromWishlist: async (userId, movieId) => {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/remove`, {
        data: {
          userId,
          movieId,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  },

  // Lấy danh sách phim yêu thích
  getWishlist: async (userId) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  },

  // Kiểm tra xem phim có trong danh sách yêu thích không
  existsInWishlist: async (userId, movieId) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/exists`, {
        params: { userId, movieId },
      });
      return response.data;
    } catch (error) {
      console.error('Error checking wishlist existence:', error);
    }
  }
};

export default WishlistService;
