import axiosInstance from "../api/axiosInstance";

const API_BASE_URL = 'http://localhost:8080/promotions';

const PromotionService = {
  getAllPromotions: async () => {
    try {
      const response = await axiosInstance.get(API_BASE_URL);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  getPromotionById: async (id) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  createPromotion: async (data) => {
    try {
      const response = await axiosInstance.post(API_BASE_URL, data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  updatePromotion: async (id, data) => {
    try {
      const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  deletePromotion: async (id) => {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

};
export default PromotionService;
