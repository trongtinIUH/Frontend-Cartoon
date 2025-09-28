import axios from "axios";
import axiosInstance from "../api/axiosInstance";

const API_BASE_URL = 'http://localhost:8080/subscription-packages';
const SubscriptionPackageService = {

    // get all packages
    getAll: async () => {
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}`);
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            response.data.sort((a, b) => a.price - b.price);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    //get all packages vs promotions
    getAllPackages: async () => {
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/all`);
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            response.data.sort((a, b) => a.price - b.price);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    //get package by id
    getPackageById: async (id) => {
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
    //create package
    createPackage: async (packageData) => {
        try {
            const response = await axiosInstance.post(`${API_BASE_URL}`, packageData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
    //update package
    updatePackage: async (id, packageData) => {
        try {
            const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, packageData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
    //delete package
    deletePackage: async (id) => {
        try {
            const response = await axiosInstance.delete(`${API_BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
};

export default SubscriptionPackageService;
