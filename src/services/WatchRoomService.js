import { join } from "lodash";
import axiosInstance from "../api/axiosInstance";

const API_BASE_URL = 'http://localhost:8080/watchrooms';

const WatchRoomService = {
    // Lấy danh sách phòng xem
    getWatchRooms: async () => {
        try {
            const response = await axiosInstance.get(API_BASE_URL);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
    // Tạo phòng xem mới
    createWatchRoom: async (data) => {
        try {
            const response = await axiosInstance.post(API_BASE_URL, data);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Lấy thông tin phòng xem theo ID
    getWatchRoomById: async (roomId) => {
        try {
            const response = await axiosInstance.get(`${API_BASE_URL}/${encodeURIComponent(roomId)}`);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    joinWatchRoom: async (data) => {
        try {
            const response = await axiosInstance.post(`${API_BASE_URL}/watch-rooms/join`, data);
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },

    // Xác thực invite code cho phòng private
    verifyInviteCode: async (roomId, inviteCode) => {
        try {
            const response = await axiosInstance.post(`${API_BASE_URL}/${encodeURIComponent(roomId)}/verify-invite`, {
                inviteCode: inviteCode
            });
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : error;
        }
    },
};
export default WatchRoomService;
