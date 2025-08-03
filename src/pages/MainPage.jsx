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
        link="/quoc-gia/han-quoc"
      />

      <CountryMoviesSection
        title="Phim Việt Nam mới"
        country="Vietnam"
        gradient="linear-gradient(235deg, #fff 30%, rgb(247, 161, 11) 130%)"
        link="/quoc-gia/viet-nam"
      />

      <CountryMoviesSection
        title="Phim US-UK mới"
        country="United Kingdom"
        gradient="linear-gradient(235deg, #fff 30%, rgb(255, 0, 153) 130%)"
        link="/quoc-gia/us-uk"
      />
      <div className="main-page container">
        <h2 className="section-title">🎬 Danh sách phim mới</h2>
        <div className="row">
          {currentMovies.map((movie) => (
            <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4" key={movie.movieId}>
              <Link
                to={`/movie/${movie.movieId}`}
                onClick={() => MovieService.incrementViewCount(movie.movieId)}
                className="movie-card-link"
              >
                <div className="movie-card">
                  <img
                    src={
                      movie.thumbnailUrl ||
                      "https://th.bing.com/th/id/OIP.044hbqIQlG5Al-y5ADrlHQHaEK?rs=1&pid=ImgDetMain"
                    }
                    alt={movie.title}
                    className="movie-thumbnail"
                  />
                  <div className="movie-info">
                    <div className="movie-title" style={{color:"white"}}>{movie.title}</div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
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
