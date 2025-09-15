import axiosInstance from "../api/axiosInstance";

const API_BASE_URL = 'http://localhost:8080/revenue';

const RevenueService = {
  // Lấy doanh thu theo ngày của 1 tháng
  getRevenueByDay: (year, month) => {
    return axiosInstance.get(`${API_BASE_URL}/day`, {
      params: { year, month }
    });
  },

  // Lấy doanh thu theo 12 tháng của 1 năm
  getRevenueByMonth: (year) => {
    return axiosInstance.get(`${API_BASE_URL}/month`, {
      params: { year }
    });
  },

  // Lấy doanh thu theo nhiều năm (from → to)
  getRevenueByYear: (from, to) => {
    return axiosInstance.get(`${API_BASE_URL}/year`, {
      params: { from, to }
    });
  }
};

export default RevenueService;
