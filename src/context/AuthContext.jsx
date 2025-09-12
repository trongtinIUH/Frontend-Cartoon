import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/AuthService';

// Tạo context cho người dùng
const AuthContext = createContext();

// Cung cấp các thông tin và hàm cần thiết qua context
export const useAuth = () => useContext(AuthContext);

// ✅ Utility function để check token expiration
const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
    } catch (error) {
        console.error('Error parsing token:', error);
        return true;
    }
};

export const AuthProvider = ({ children }) => {
    const [MyUser, setMyUser] = useState(null);

    // Kiểm tra auth state khi component mount
    useEffect(() => {
        const checkAuthState = async () => {
            // Chỉ sử dụng my_user
            const storedUser = localStorage.getItem('my_user');
            const idToken = localStorage.getItem('idToken');
            
            if (storedUser && idToken) {
                try {
                    const userData = JSON.parse(storedUser);
                    
                    // ✅ Kiểm tra token expiration
                    if (isTokenExpired(idToken)) {
                        console.log("🔄 Token expired, attempting refresh...");
                        
                        try {
                            const newAuth = await AuthService.refresh();
                            if (newAuth?.idToken) {
                                localStorage.setItem('idToken', newAuth.idToken);
                                localStorage.setItem('my_user', JSON.stringify(newAuth));
                                setMyUser(newAuth);
                                return;
                            }
                        } catch (refreshError) {
                            console.warn("🔒 Token refresh failed");
                            // Clear expired data
                            localStorage.removeItem('my_user');
                            localStorage.removeItem('idToken');
                            localStorage.removeItem('phoneNumber');
                            localStorage.removeItem('userAttributes');
                            setMyUser(null);
                            return;
                        }
                    }
                    
                    setMyUser(userData);
                } catch (error) {
                    console.error('Error parsing stored user:', error);
                    setMyUser(null);
                }
            } else {
                setMyUser(null);
            }
            
            // Cleanup auth_data cũ nếu tồn tại
            if (localStorage.getItem('auth_data')) {
                localStorage.removeItem('auth_data');
            }
        };

        checkAuthState();

        // Listen for storage changes (for multi-tab sync)
        const handleStorageChange = (event) => {
            if (event.key === 'my_user') {
                checkAuthState();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Hàm login để lưu thông tin vào context và localStorage
    const login = (userData, callback) => {
        setMyUser(userData);
        
        // Chỉ lưu vào my_user
        localStorage.setItem('my_user', JSON.stringify(userData));
        localStorage.setItem('idToken', userData.idToken);
        localStorage.setItem('phoneNumber', userData.username || userData.my_user?.phoneNumber);
        localStorage.setItem('userAttributes', JSON.stringify(userData.userAttributes));

        // Cleanup auth_data cũ nếu tồn tại
        if (localStorage.getItem('auth_data')) {
            localStorage.removeItem('auth_data');
        }

        if (callback) {
            callback();
        }
    };

    // Hàm logout để xóa thông tin trong context và localStorage
    const logout = (callback) => {
        setMyUser(null);
        
        // Clear tất cả auth data
        localStorage.removeItem('my_user');
        localStorage.removeItem('auth_data'); // cleanup auth_data cũ
        localStorage.removeItem('idToken');
        localStorage.removeItem('phoneNumber');
        localStorage.removeItem('userAttributes');

        if (callback) {
            setTimeout(() => {
                callback();
            }, 3000);
        }
    };

    // Hàm updateUserInfo để cập nhật thông tin người dùng mà không mất dữ liệu cũ
    const updateUserInfo = (updatedUserData) => {
        setMyUser((prevUser) => {
            if (!prevUser) return updatedUserData;
            
            const updatedUser = { ...prevUser, ...updatedUserData };
            
            // Chỉ lưu vào my_user
            localStorage.setItem('my_user', JSON.stringify(updatedUser));
            
            return updatedUser;
        });
    };

    return (
        <AuthContext.Provider value={{ MyUser, setMyUser, login, logout, updateUserInfo }}>
            {children}
        </AuthContext.Provider>
    );
};