import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import MovieService from '../../services/MovieService';
import '../../css/admin/DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [popularMovies, setPopularMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPopularMovies();
  }, []);

  const fetchPopularMovies = async () => {
    try {
      setLoading(true);
      const movies = await MovieService.getPopularMovies();
      // Lấy 5 phim đầu tiên
      setPopularMovies(movies.slice(0, 5));
    } catch (error) {
      console.error('Error fetching popular movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = () => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const day = days[currentTime.getDay()];
    const date = currentTime.getDate();
    const month = currentTime.getMonth() + 1;
    const year = currentTime.getFullYear();
    return `${day}, ${date}/${month}/${year}`;
  };

  const formatTime = () => {
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  };

  return (
    <div className="d-flex bg-white min-vh-100">
      <Sidebar />
      <div className="flex-grow-1 dashboard-container" style={{ marginLeft: '250px' }}>
        {/* Welcome Header với Ngày giờ */}
        <div className="welcome-header">
          <div className="welcome-text">
            <h1>👋 Xin chào, Admin!</h1>
            <p>Chào mừng bạn quay trở lại với hệ thống quản lý</p>
          </div>
          <div className="datetime-display">
            <div className="date-box">
              <i className="fas fa-calendar-alt"></i>
              <span>{formatDate()}</span>
            </div>
            <div className="time-box">
              <i className="fas fa-clock"></i>
              <span className="time-text">{formatTime()}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <h2 className="section-title">📊 Thống kê nhanh</h2>
      <div className="row">
        <div className="col-md-3">
          <div className="card text-white bg-info mb-3 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3>150</h3>
                  <p className="card-text">New Orders</p>
                </div>
                <i className="fas fa-shopping-bag fa-3x"></i>
              </div>
              <a href="#" className="text-white text-decoration-none d-block mt-2">
                More info <i className="fas fa-arrow-circle-right"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-success mb-3 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3>53%</h3>
                  <p className="card-text">Bounce Rate</p>
                </div>
                <i className="fas fa-chart-bar fa-3x"></i>
              </div>
              <a href="#" className="text-white text-decoration-none d-block mt-2">
                More info <i className="fas fa-arrow-circle-right"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-warning mb-3 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3>44</h3>
                  <p className="card-text">User Registrations</p>
                </div>
                <i className="fas fa-user-plus fa-3x"></i>
              </div>
              <a href="#" className="text-white text-decoration-none d-block mt-2">
                More info <i className="fas fa-arrow-circle-right"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-danger mb-3 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3>65</h3>
                  <p className="card-text">Unique Visitors</p>
                </div>
                <i className="fas fa-chart-pie fa-3x"></i>
              </div>
              <a href="#" className="text-white text-decoration-none d-block mt-2">
                More info <i className="fas fa-arrow-circle-right"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Movies Section */}
      <div className="movies-section">
        <div className="section-header">
          <h2 className="section-title">🔥 Top 5 Phim Hot Nhất</h2>
          <Link to="/main" className="view-all-btn">
            Xem trang chính <i className="fas fa-arrow-right"></i>
          </Link>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Đang tải phim...</p>
          </div>
        ) : (
          <div className="posters-grid">
            {popularMovies.length > 0 ? (
              popularMovies.map((movie) => (
                <div key={movie.movieId} className="poster-card">
                  <div 
                    className="poster-image"
                    onClick={() => navigate(`/movie/${movie.movieId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img 
                      src={movie.thumbnailUrl || 'https://via.placeholder.com/300x400/667eea/ffffff?text=' + encodeURIComponent(movie.title)}
                      alt={movie.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x400/667eea/ffffff?text=' + encodeURIComponent(movie.title);
                      }}
                    />
                    <div className="poster-overlay">
                      <div className="overlay-content">
                        <h4>{movie.title}</h4>
                        <p>
                          <i className="fas fa-eye"></i> {formatViews(movie.viewCount || 0)} lượt xem
                        </p>
                        <p>
                          <i className="fas fa-star"></i> {movie.avgRating ? movie.avgRating.toFixed(1) : 'N/A'} / 5
                        </p>
                        <button 
                          className="play-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/movie/${movie.movieId}`);
                          }}
                        >
                          <i className="fas fa-play"></i> Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="poster-info">
                    <h5 title={movie.title}>{movie.title}</h5>
                    <div className="movie-meta">
                      <span className="views-badge">
                        <i className="fas fa-fire"></i> {formatViews(movie.viewCount || 0)}
                      </span>
                      <span className="rating-badge">
                        <i className="fas fa-star"></i> {movie.avgRating ? movie.avgRating.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-movies">
                <i className="fas fa-film fa-3x mb-3"></i>
                <p>Chưa có phim nào</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
      </div>
  );
};

export default DashboardPage;
