import React, { useEffect, useState, useCallback } from "react";
import "../css/MainPage.css";
import { Link, useOutletContext } from "react-router-dom";
import MovieService from "../services/MovieService";
import MovieSlider from "../components/MovieSlider";
import TopicSection from "../components/TopicSection";
import CountriesBlock from "../components/CountriesBlock";
import Top10MoviesSection from "../components/Top10MoviesSection";
import HotFavoriteCharts from "../components/HotFavoriteCharts";
import PersonalizedRecommendations from "../components/PersonalizedRecommendations";
import RecentlyWatchedSection from "../components/RecentlyWatchedSection";
import { trackSignal, getCurrentUserId } from "../services/personalizationService";

const MOVIES_PER_PAGE = 20;

const MainPage = () => {
  const { movies, setMovies } = useOutletContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredMovies, setFilteredMovies] = useState([]);

  const fetchMovies = useCallback(async () => {
    try {
      const data = await MovieService.getAllMovies();
      if (Array.isArray(data)) {
        setMovies(data);
        setFilteredMovies(data);
      } else {
        setMovies([]);
        setFilteredMovies([]);
      }
    } catch {
      setMovies([]);
      setFilteredMovies([]);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);
  const startIdx = (currentPage - 1) * MOVIES_PER_PAGE;
  const currentMovies = filteredMovies.slice(startIdx, startIdx + MOVIES_PER_PAGE);

  // 🎯 Track movie click from main page
  const handleMovieClick = (movieId) => {
    const userId = getCurrentUserId();
    if (userId && movieId) {
      trackSignal(userId, 'click_movie', movieId, {
        source: 'main_page',
        timestamp: new Date().toISOString()
      });
    }
    MovieService.incrementViewCount(movieId);
  };

  return (
    <div className="main-page-wrapper">
      <MovieSlider />
      <TopicSection />

      {/* 🎯 AI-Powered Personalized Recommendations */}
      <div className="container-xl">
        <PersonalizedRecommendations limit={6} />
      </div>

      {/* 🎯 Recently Watched Movies */}
      <div className="container-xl">
        <RecentlyWatchedSection limit={10} />
      </div>

       {/* ---- KHỐI NỀN LỚN GỘP 3 QUỐC GIA ---- */}
      <CountriesBlock />
      
      <Top10MoviesSection />

      <HotFavoriteCharts />   
      
      <div className="main-page container-xl">
        <h2 className="section-title">Danh sách phim mới trong tháng</h2>
          <div className="newlist">
        <div className="movie-grid">
          {currentMovies.map((movie) => {
            const poster =
              movie.thumbnailUrl ||
              "https://placehold.co/400x600/0b1220/8aa0b6?text=No+Poster";
            const minVipLevel = movie.minVipLevel || "FREE";
            
            // Xác định badge dựa trên gói VIP
            const getBadgeInfo = (level) => {
              switch(level) {
                case "NO_ADS":
                  return { text: "AD-FREE", class: "no-ads-badge" };
                case "PREMIUM":
                  return { text: "PREMIUM", class: "premium-badge" };
                case "MEGA_PLUS":
                  return { text: "MEGA+", class: "mega-plus-badge" };
                case "COMBO_PREMIUM_MEGA_PLUS":
                  return { text: "COMBO", class: "combo-badge" };
                default:
                  return null;
              }
            };
            
            const badgeInfo = getBadgeInfo(minVipLevel);

            return (
              <Link
                key={movie.movieId}
                to={`/movie/${movie.movieId}`}
                onClick={() => handleMovieClick(movie.movieId)}
                className="poster-card"
              >
                <div className="poster-wrap">
                  <img
                    className="poster-img"
                    src={poster}
                    alt={movie.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://placehold.co/400x600/0b1220/8aa0b6?text=No+Poster";
                    }}
                  />
                  {badgeInfo && (
                    <span className={`vip-badge ${badgeInfo.class}`}>
                      {badgeInfo.text}
                    </span>
                  )}
                </div>

                <div className="poster-meta">
                  <h3 className="title-vn">{movie.title}</h3>
                  <p className="title-en">
                    {movie.originalTitle || movie.slug || "\u00A0"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
    </div>
        <nav className="pagination-nav mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                &laquo;
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default MainPage;
