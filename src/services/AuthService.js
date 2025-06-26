import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/auth';

const AuthService = {
    post: async (url, data) => {
        try {
            const response = await axios.post(`${API_BASE_URL}${url}`, data);
            console.log("e", response.data);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    //change password
    changePassword: async ({username,currentPassword,newPassword }) => {
        return await AuthService.post('/change-password', {username,currentPassword,newPassword });
    },
};

export default AuthService;


