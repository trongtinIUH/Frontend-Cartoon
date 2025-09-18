import axiosInstance from "../api/axiosInstance";

const API_BASE_URL = 'http://localhost:8080/data-analyzer';

const RevenueService = {
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
  }

};

export default RevenueService;
