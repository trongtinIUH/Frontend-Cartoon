import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainPage from './pages/MainPage';    
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import MovieDetailPage from './pages/MovieDetailPage';
import ControlPanelPage from './pages/ControlPanelPage';
import ManageMoviePage from './pages/ManageMoviePage';
import GenreMoviesPage from './pages/GenreMoviesPage';
import SearchResultPage from './pages/SearchResultPage';  
import ProfilePage from './pages/ProfilePage';
import { useAuth } from './context/AuthContext';
import Layout from "./layout/Layout";
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const navigate = useNavigate();
  const {MyUser} = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const idToken = localStorage.getItem('idToken');

const protectedRoutes = ['/control-panel', '/manage-movie']; // các route yêu cầu đăng nhập

if (!MyUser && !idToken && protectedRoutes.includes(location.pathname)) {
  setTimeout(() => {
    navigate('/'); // quay về login
  }, 2000);
}


  setIsLoading(false);
}, [MyUser, navigate, location.pathname]);


    return (
        !isLoading && (
            <>
                <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/create-user" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                  {/* Các route cần dùng Layout */}
                  <Route element={<Layout />}>
                    <Route path="/main" element={<MainPage />} />
                    <Route path="/movie/:id" element={<MovieDetailPage />} />
                    <Route path="/control-panel" element={<ControlPanelPage />} />
                    <Route path="/manage-movie" element={<ManageMoviePage />} />
                    <Route path="/the-loai/:genre" element={<GenreMoviesPage />} />
                    <Route path="/tim-kiem/:title" element={<SearchResultPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                </Routes>

                {/* Thêm ToastContainer để hiển thị thông báo toast */}
                <ToastContainer />
            </>
        )
    );
}

export default App;
