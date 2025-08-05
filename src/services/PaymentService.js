import axios from "axios";
import axiosInstance from "../api/axiosInstance";

const API_BASE_URL = 'http://localhost:8080/payment';

const PaymentService = {
    // Create a new payment
    createPayment: async (paymentData) => {
        try {
            const response = await axiosInstance.post(`${API_BASE_URL}/create`, paymentData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
    // Get payment status by order code
    getPaymentStatus: async (orderCode) => {
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/${orderCode}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
    // Webhook to handle payment notifications
    handleWebhook: async (webhookData) => {
        try {
            const response = await axiosInstance.post(`${API_BASE_URL}/webhook`, webhookData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
    // Cancel a payment (if applicable)
    cancelPayment: async (orderCode) => {
        try {
            const response = await axiosInstance.put(`${API_BASE_URL}/cancel/${orderCode}`, {});
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    }   
};

export default PaymentService;
