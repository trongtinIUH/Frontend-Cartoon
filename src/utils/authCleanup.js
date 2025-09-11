// Utility để cleanup auth data cũ trong localStorage
export const cleanupAuthData = () => {
    const authData = localStorage.getItem('auth_data');
    const myUser = localStorage.getItem('my_user');
    
    // Nếu có auth_data nhưng không có my_user, migrate dữ liệu
    if (authData && !myUser) {
        try {
            const parsedAuthData = JSON.parse(authData);
            localStorage.setItem('my_user', JSON.stringify(parsedAuthData));
            console.log('Migrated auth_data to my_user');
        } catch (error) {
            console.error('Error migrating auth_data:', error);
        }
    }
    
    // Cleanup auth_data trong mọi trường hợp
    if (authData) {
        localStorage.removeItem('auth_data');
        console.log('Removed deprecated auth_data from localStorage');
    }
};

// Chạy cleanup khi import
cleanupAuthData();
