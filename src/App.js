import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainPage from './pages/MainPage';    
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import MovieDetailPage from './pages/MovieDetailPage';
import ControlPanelPage from './pages/ControlPanelPage';
import ManageMoviePage from './pages/ManageMoviePage';
import { useAuth } from './context/AuthContext';
import { ToastContainer, toast } from 'react-toastify'; // Import ToastContainer và toast
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  const navigate = useNavigate();
  const {MyUser} = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const idToken = localStorage.getItem('idToken');

  if (!MyUser && !idToken && !['/create-user', '/forgot-password'].includes(location.pathname)) {
    setTimeout(() => {
      navigate('/'); // Chỉ chuyển về login nếu chưa đăng nhập
    }, 2000);
  }

  setIsLoading(false);
}, [MyUser, navigate, location.pathname]);


    return (
        !isLoading && (
            <>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/main" element={<MainPage />} />
                    <Route path="/create-user" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/movie/:id" element={<MovieDetailPage />} />
                    <Route path="/control-panel" element={<ControlPanelPage />} />
                    <Route path="/manage-movie" element={<ManageMoviePage />} />
                 
                    {/* Thêm các route khác nếu cần */}

                </Routes>

                {/* Thêm ToastContainer để hiển thị thông báo toast */}
                <ToastContainer />
            </>
        )
    );
}

export default App;
