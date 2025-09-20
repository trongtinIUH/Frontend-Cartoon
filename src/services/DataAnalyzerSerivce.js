import axiosInstance from "../api/axiosInstance";

const API_BASE_URL = 'http://localhost:8080/data-analyzer';

const RevenueService = {
  // ======= REVENUE ANALYTICS =======
  // Lấy doanh thu theo ngày của 1 tháng
  getRevenueByDay: (year, month) => {
    return axiosInstance.get(`${API_BASE_URL}/revenue/day`, {
      params: { year, month }
    });
  },

  // Lấy doanh thu theo 12 tháng của 1 năm
  getRevenueByMonth: (year) => {
    return axiosInstance.get(`${API_BASE_URL}/revenue/month`, {
      params: { year }
    });
  },

  // Lấy doanh thu theo nhiều năm (from → to)
  getRevenueByYear: (from, to) => {
    return axiosInstance.get(`${API_BASE_URL}/revenue/year`, {
      params: { from, to }
    });
  },

  // tổng quan doanh thu
  getSummary: () => {
    return axiosInstance.get(`${API_BASE_URL}/revenue/summary`);
  },

  // thống kê nhanh
  getQuickStats: () => {
    return axiosInstance.get(`${API_BASE_URL}/revenue/quick-stats`);
  },

  // ======= MOVIE ANALYTICS =======
  // Tổng quan thống kê phim
  getMovieSummary: (year, month) => {
    return axiosInstance.get(`${API_BASE_URL}/movies/summary`, {
      params: { year, month }
    });
  },

  // Phim mới theo ngày trong tháng
  getNewMoviesByDay: (year, month) => {
    return axiosInstance.get(`${API_BASE_URL}/movies/new/day`, {
      params: { year, month }
    });
  },

  // Phim mới theo tháng trong năm
  getNewMoviesByMonth: (year) => {
    return axiosInstance.get(`${API_BASE_URL}/movies/new/month`, {
      params: { year }
    });
  },

  // Thống kê theo thể loại
  getCountByGenre: (top = 10) => {
    return axiosInstance.get(`${API_BASE_URL}/movies/genre`, {
      params: { top }
    });
  },

  // Thống kê theo quốc gia
  getCountByCountry: (top = 10) => {
    return axiosInstance.get(`${API_BASE_URL}/movies/country`, {
      params: { top }
    });
  },

  // Thống kê theo trạng thái
  getStatusBreakdown: () => {
    return axiosInstance.get(`${API_BASE_URL}/movies/status`);
  },

  // Thống kê theo loại phim
  getTypeBreakdown: () => {
    return axiosInstance.get(`${API_BASE_URL}/movies/type`);
  },

  // Phân bố năm phát hành
  getReleaseYearDistribution: (from, to) => {
    return axiosInstance.get(`${API_BASE_URL}/movies/release-year`, {
      params: { from, to }
    });
  },

  // Số tập mỗi season của một phim
  getEpisodesPerSeason: (movieId) => {
    return axiosInstance.get(`${API_BASE_URL}/movies/${movieId}/episodes-per-season`);
  },

  // Top phim theo lượt xem
  getTopByViews: (limit = 10) => {
    return axiosInstance.get(`${API_BASE_URL}/movies/top/views`, {
      params: { limit }
    });
  },

  // Top phim theo rating
  getTopByRating: (limit = 10, minRatings = 5) => {
    return axiosInstance.get(`${API_BASE_URL}/movies/top/rating`, {
      params: { limit, minRatings }
    });
  }
};

export default RevenueService;
