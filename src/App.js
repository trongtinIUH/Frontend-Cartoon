import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainPage from './pages/MainPage';    
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import MovieDetailPage from './pages/MovieDetailPage';
import ControlPanelPage from './pages/ControlPanelPage';
import ManageMoviePage from './pages/ManageMoviePage';
import SearchResultPage from './pages/SearchResultPage';  
import ProfilePage from './pages/ProfilePage';
import WatchPage from "./pages/WatchPage";
import BuyPackagePage from './pages/BuyPackagePage';
import AllTopicsPage from './pages/AllTopicsPage';
import { useAuth } from './context/AuthContext';
import Layout from "./layout/Layout";
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardPage from './pages/admin/DashboardPage';
import MovieManagementPage from './pages/admin/MovieManagementPage';
import PaymentPage from './pages/PaymentPage';
import PurchaseHistoryPage from './pages/PurchaseHistoryPage';
import BrowseMoviesPage from "./pages/BrowseMoviesPage";


import "react-toastify/dist/ReactToastify.css";
import "./css/toastCSS/toast.css";
import CustomToastCloseButton from "./utils/CustomToastCloseButton";
import FavoritesPage from './pages/FavoritesPage';
import PromotionManagementPage from './pages/admin/PromotionManagementPage';

import ProtectedRoute from './components/ProtectedRoute';

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
                    <Route path="/tim-kiem/:title" element={<SearchResultPage />} />
                    <Route path="/danh-muc/:kind/:value" element={<BrowseMoviesPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/purchase-history" element={<PurchaseHistoryPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                 
                    {/* New slug-based watch route */}
                    <Route path="/watch/:movieSlug/:episodeSlug" element={<WatchPage />} />
                  {/* Backward compatibility for old ID-based URLs */}
                    <Route path="/watch/:movieId/:episodeId" element={<WatchPage />} />
                    
                    <Route path="/buy-package" element={<BuyPackagePage />} />
                    <Route path="/payment" element={<PaymentPage />} />
                    <Route path="/all-topics" element={<AllTopicsPage />} />
                  </Route>
                  <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                    <Route path="/admin-dashboard" element={<DashboardPage />} />
                    <Route path="/admin-movie" element={<MovieManagementPage />} />
                    <Route path="/admin-promotion" element={<PromotionManagementPage />} />
                  </Route>
                </Routes>

                {/* Thêm ToastContainer để hiển thị thông báo toast */}
                <ToastContainer
                position="top-right"
                autoClose={2200}
                hideProgressBar={false}
                closeButton={<CustomToastCloseButton />}
                newestOnTop
                limit={3}
                draggable
                pauseOnHover
                toastClassName="ct-toast"
                bodyClassName="ct-toast__body"
                progressClassName="ct-toast__progress"
                />
            </>
        )
    );
}

export default App;
