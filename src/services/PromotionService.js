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

  // lay tat ca package thuoc khuyen mai
  getPromotionPackages: async (id) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/packages?promotionId=${id}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  // ap dung package vao promotion
  createPromotionPackage: async (data) => {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/packages`, data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  // ap dung ma khuyen mai cho order
  applyVoucherCode: async (data) => {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/vouchers/apply`, data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  // lay thong tin vouchercode
  getVoucherInfo: async (voucherCode) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/voucher?voucherCode=${voucherCode}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  // tao voucher
  createPromotionVoucher: async (data) => {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/vouchers`, data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // lay thong tin tat ca voucher theo promotion
  getPromotionVouchers: async (promotionId) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/vouchers?promotionId=${promotionId}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};
export default PromotionService;
