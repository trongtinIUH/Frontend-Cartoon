import React, { useEffect, useState, useCallback } from "react";
import "../css/MainPage.css";
import { Link, useOutletContext } from "react-router-dom";
import MovieService from "../services/MovieService";
import MovieSlider from "../components/MovieSlider";
import TopicSection from "../components/TopicSection";
import CountryMoviesSection from "../components/CountryMoviesSection";

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

  return (
    <div className="main-page-wrapper">
      <MovieSlider />
      <TopicSection />

      <CountryMoviesSection
        title="Phim Hàn Quốc mới"
        country="South Korea"
        gradient="linear-gradient(235deg, #fff 30%, rgb(103, 65, 150) 130%)"
       link={`/danh-muc/quoc-gia/${encodeURIComponent("South Korea")}`}
      />

      <CountryMoviesSection
        title="Phim Việt Nam mới"
        country="Vietnam"
        gradient="linear-gradient(235deg, #fff 30%, rgb(247, 161, 11) 130%)"
        link={`/danh-muc/quoc-gia/${encodeURIComponent("Vietnam")}`}
      />

      <CountryMoviesSection
        title="Phim US-UK mới"
        country="United Kingdom"
        gradient="linear-gradient(235deg, #fff 30%, rgb(255, 0, 153) 130%)"
        link={`/danh-muc/quoc-gia/${encodeURIComponent("United Kingdom")}`}
      />
      <div className="main-page container-xl">
        <h2 className="section-title">Danh sách phim mới trong tháng</h2>
          <div className="newlist">
        <div className="movie-grid">
          {currentMovies.map((movie) => {
            const poster =
              movie.thumbnailUrl ||
              "https://placehold.co/400x600/0b1220/8aa0b6?text=No+Poster";
            const isPremium = (movie.minVipLevel || "FREE") !== "FREE";

            return (
              <Link
                key={movie.movieId}
                to={`/movie/${movie.movieId}`}
                onClick={() => MovieService.incrementViewCount(movie.movieId)}
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
                  {isPremium && <span className="vip-badge">P.ĐỀ</span>}
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
