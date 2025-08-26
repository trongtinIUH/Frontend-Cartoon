import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// components/ProtectedRoute.jsx
const ProtectedRoute = ({ children, requiredRole }) => {
  const { MyUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!MyUser || MyUser?.my_user?.role !== requiredRole) {
      navigate('/main'); // redirect về trang chủ
    }
  }, [MyUser, requiredRole, navigate]);
  
  if (!MyUser || MyUser?.my_user?.role !== requiredRole) {
    return <div>Không có quyền truy cập</div>;
  }
  
  return children || <Outlet />;
};

export default ProtectedRoute;