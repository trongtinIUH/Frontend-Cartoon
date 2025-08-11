import axios from 'axios';
import axiosInstance from "../api/axiosInstance";
const API_BASE_URL = 'http://localhost:8080/users';

const UserService = {
    //get user by id
    getUserById: async (userId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/${userId}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
    updateUserById: async (userId, userData, avatarFile) => {
        try {
            const formData = new FormData();
            formData.append("user", new Blob([JSON.stringify(userData)], { type: "application/json" }));
            if (avatarFile) {
                formData.append("file", avatarFile);
            }

            const response = await axiosInstance.put(`${API_BASE_URL}/${userId}/update`, formData);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    getUserSubscriptionPackages: async (userId) => {
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/${userId}/subscription-packages`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    }

};


export default UserService;


