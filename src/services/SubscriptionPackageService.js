import axios from "axios";
import axiosInstance from "../api/axiosInstance";

const API_BASE_URL = 'http://localhost:8080/subscription-packages';
const SubscriptionPackageService = {

    // get all packages
    getAll: async (page, size, keyword = "") => {
        try {
            const response = await axiosInstance.get(API_BASE_URL, {
                params: { page: page - 1, size, keyword },
            });
            const total = Number(response.headers["x-total-count"] ?? 0);
            return { items: response.data, total };
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
    createPackage: async (payload, imageFile) => {
        const fd = new FormData();
        // Part "data" phải có content-type application/json
        fd.append(
            "data",
            new Blob([JSON.stringify(payload)], { type: "application/json" })
        );
        if (imageFile) {
            fd.append("image", imageFile); // browser sẽ tự set type image/*
        }

        const res = await axiosInstance.post(`${API_BASE_URL}`, fd, {
            headers: { "Content-Type": "multipart/form-data" }, // có thể bỏ, axios tự set boundary
        });
        return res.data;
    },
    //update package
    updatePackage: async (packageId, payload, imageFile) => {
        const fd = new FormData();
        fd.append(
            "data",
            new Blob([JSON.stringify(payload)], { type: "application/json" })
        );
        if (imageFile) {
            fd.append("image", imageFile);
        }

        const res = await axiosInstance.put(`${API_BASE_URL}/${packageId}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
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
