import axios from 'axios';

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
};

//update user by id
UserService.updateUserById = async (userId, userData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/${userId}`, userData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
};

export default UserService;


