import axiosInstance from "../api/axiosInstance";

const API_BASE_URL = 'http://localhost:8080/export';

const ExportService = {
    // Xuất báo cáo doanh thu
    exportRevenueReport: (from, to) => {
        return axiosInstance.get(`${API_BASE_URL}/dashboard`, {
            params: { from, to },
            responseType: 'blob' // Đảm bảo nhận về file
        });
    }
};

export default ExportService;