import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/AuthService';

// Tạo context cho người dùng
const AuthContext = createContext();

// Cung cấp các thông tin và hàm cần thiết qua context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [MyUser, setMyUser] = useState(null);

    // Kiểm tra auth state khi component mount
    useEffect(() => {
        const checkAuthState = () => {
            // Ưu tiên check AuthService trước
            const authData = AuthService.getAuth();
            if (authData?.accessToken) {
                setMyUser(authData);
                return;
            }

            // Fallback: check localStorage cũ
            const storedUser = localStorage.getItem('my_user');
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    setMyUser(userData);
                } catch (error) {
                    console.error('Error parsing stored user:', error);
                    setMyUser(null);
                }
            } else {
                setMyUser(null);
            }
        };

        checkAuthState();

        // Listen for storage changes (for multi-tab sync)
        const handleStorageChange = (event) => {
            if (event.key === 'auth_data' || event.key === 'my_user') {
                checkAuthState();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Hàm login để lưu thông tin vào context và localStorage
    const login = (userData, callback) => {
        // Nếu userData có accessToken, lưu vào AuthService
        if (userData.accessToken) {
            AuthService.setAuth(userData);
        }
        
        setMyUser(userData);
        
        // Backward compatibility: lưu vào localStorage cũ
        localStorage.setItem('idToken', userData.idToken);
        localStorage.setItem('my_user', JSON.stringify(userData));
        localStorage.setItem('phoneNumber', userData.username || userData.my_user?.phoneNumber);
        localStorage.setItem('userAttributes', JSON.stringify(userData.userAttributes));

        if (callback) {
            callback();
        }
    };

    // Hàm logout để xóa thông tin trong context và localStorage
    const logout = (callback) => {
        setMyUser(null);
        
        // Clear AuthService
        AuthService.clearAuth();
        
        // Clear localStorage cũ
        localStorage.removeItem('idToken');
        localStorage.removeItem('my_user');
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
            
            // Cập nhật AuthService nếu có accessToken
            if (updatedUser.accessToken) {
                AuthService.setAuth(updatedUser);
            }
            
            // Backward compatibility
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