/**
 * PersonalizedRecommendations - AI-powered personalized movie recommendations
 * @author Frontend Team
 * @version 1.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendations, getScoreBadge, trackSignal, getCurrentUserId } from '../services/personalizationService';
import '../css/PersonalizedRecommendations.css';

const PersonalizedRecommendations = ({ limit = 20 }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = getCurrentUserId();

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getRecommendations(userId, limit);
        
        // Sort by score (highest first)
        const sorted = data.sort((a, b) => (b.score || 0) - (a.score || 0));
        setRecommendations(sorted);
        
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId, limit]);

  // Handle movie click
  const handleMovieClick = (movie) => {
    if (userId && movie.movieId) {
      trackSignal(userId, 'click_movie', movie.movieId, {
        source: 'personalized_recommendations',
        score: String(movie.score || 0),
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
      <div className="personalized-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">🎯</span>
            Dành Riêng Cho Bạn
          </h2>
          <p className="section-subtitle">Được đề xuất bởi AI dựa trên sở thích của bạn</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải gợi ý phim...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return null; // Fail silently, don't break the page
  }

  // Empty state (user mới, chưa có data)
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="personalized-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-icon">🎯</span>
            Dành Riêng Cho Bạn
          </h2>
          <p className="section-subtitle">Được đề xuất bởi AI dựa trên sở thích của bạn</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <h3>Chưa có gợi ý phim</h3>
          <p>Hãy xem một vài bộ phim để chúng tôi hiểu sở thích của bạn!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="personalized-section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="title-icon">🎯</span>
          Dành Riêng Cho Bạn
        </h2>
        <p className="section-subtitle">Được đề xuất bởi AI dựa trên sở thích của bạn</p>
      </div>

      <div className="movie-grid">
        {recommendations.map((movie) => {
          const badge = getScoreBadge(movie.score);
          
          return (
            <Link
              key={movie.movieId}
              to={`/movie/${movie.movieId}`}
              className="movie-card"
              onClick={() => handleMovieClick(movie)}
            >
              <div className="movie-poster">
                <img
                  src={movie.thumbnailUrl}
                  alt={movie.title}
                  loading="lazy"
                />
                
                {/* Score Badge - Emoji + Percentage */}
                {badge && (
                  <div className="score-badge">
                    <span className="badge-emoji">{badge.emoji}</span>
                    <span className="badge-score">{badge.percentage}%</span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="movie-overlay">
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
                    {movie.releaseYear && (
                      <div className="movie-year">{movie.releaseYear}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Movie info below poster */}
              <div className="movie-info">
                <h4 className="movie-title-main">{movie.title}</h4>
                {movie.score && (
                  <div className="movie-match">
                    {Math.round(movie.score * 100)}%
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

export default PersonalizedRecommendations;
