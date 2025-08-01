import axios from "axios";

const API_BASE_URL = 'http://localhost:8080/subscription-packages';
const SubscriptionPackageService = {

    //get all packages
    getAllPackages: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/all`);
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
            const response = await axios.get(`${API_BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    }
};

export default SubscriptionPackageService;
