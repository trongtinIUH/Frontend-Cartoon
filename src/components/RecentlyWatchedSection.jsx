/**
 * RecentlyWatchedSection - Display recently watched movies from AI tracking
 * @author Frontend Team
 * @version 1.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecentlyWatched, trackSignal, getCurrentUserId } from '../services/personalizationService';
import '../css/RecentlyWatchedSection.css';

const RecentlyWatchedSection = ({ limit = 10 }) => {
  const [recentMovies, setRecentMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = getCurrentUserId();

  useEffect(() => {
    const fetchRecentlyWatched = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getRecentlyWatched(userId, limit);
        setRecentMovies(data);
      } catch (err) {
        console.error('Failed to fetch recently watched:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyWatched();
  }, [userId, limit]);

  // Handle movie click
  const handleMovieClick = (movie) => {
    if (userId && movie.movieId) {
      trackSignal(userId, 'click_movie', movie.movieId, {
        source: 'recently_watched',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Don't show section if user not logged in
  if (!userId) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="recently-watched-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">🕐</span>
            Xem Gần Đây
          </h2>
          <p className="section-subtitle">Tiếp tục từ nơi bạn đã dừng lại</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải lịch sử xem...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return null; // Fail silently
  }

  // Empty state
  if (!recentMovies || recentMovies.length === 0) {
    return null; // Don't show section if no history
  }

  return (
    <div className="recently-watched-section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="title-icon">🕐</span>
          Xem Gần Đây
        </h2>
        <p className="section-subtitle">Tiếp tục từ nơi bạn đã dừng lại</p>
      </div>

      <div className="recently-watched-grid">
        {recentMovies.map((movie) => {
          return (
            <Link
              key={movie.movieId}
              to={`/movie/${movie.movieId}`}
              className="recently-watched-card"
              onClick={() => handleMovieClick(movie)}
            >
              <div className="recently-watched-poster">
                <img
                  src={movie.thumbnailUrl}
                  alt={movie.title}
                  loading="lazy"
                />
                
                {/* Continue watching indicator */}
                <div className="continue-indicator">
                  <span className="continue-icon">▶</span>
                  <span className="continue-text">Tiếp tục xem</span>
                </div>

                {/* Overlay */}
                <div className="recently-watched-overlay">
                  <div className="overlay-content">
                    <h3 className="movie-title">{movie.title}</h3>
                    {movie.genres && movie.genres.length > 0 && (
                      <div className="movie-genres">
                        {movie.genres.slice(0, 3).map((genre, idx) => (
                          <span key={idx} className="genre-tag">
                            {typeof genre === 'string' ? genre : genre.name || genre.slug}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Movie info */}
              <div className="recently-watched-info">
                <h4 className="movie-title-main">{movie.title}</h4>
                {movie.lastWatched && (
                  <div className="last-watched">
                    {formatLastWatched(movie.lastWatched)}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// Helper function to format last watched time
function formatLastWatched(lastWatched) {
  if (!lastWatched) return '';
  
  try {
    const date = new Date(lastWatched);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }
  } catch (e) {
    return '';
  }
}

export default RecentlyWatchedSection;
