// CountryMoviesSection.jsx
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import MovieService from "../services/MovieService";
import { Link } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/CountryMoviesSection.css";

const CountryMoviesSection = ({ title, country, countries, link, gradient, noBg = false }) => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        let allMovies = [];

        if (countries && Array.isArray(countries)) {
          const promises = countries.map((countryName) =>
            MovieService.getMoviesByCountry(countryName)
          );
          const results = await Promise.all(promises);
          allMovies = results.flat().filter(Boolean);

          // dedup by movieId
          const uniqueMovies = allMovies.filter(
            (movie, idx, self) => idx === self.findIndex((m) => m.movieId === movie.movieId)
          );
          setMovies(uniqueMovies);
        } else if (country) {
          const res = await MovieService.getMoviesByCountry(country);
          setMovies(Array.isArray(res) ? res : []);
        }
      } catch (e) {
        console.error("Error fetching movies:", e);
        setMovies([]);
      }
    };

    fetchMovies();
  }, [country, countries]);

  const navKey = title.replace(/\s+/g, "-");

  return (
    <div className={`country-movies-section ${noBg ? "no-bg" : ""}`}>
      <div
        className={`wapper d-flex align-items-center ${noBg ? "no-bg" : ""}`}
        style={!noBg ? { borderRadius: "10px" } : undefined}
      >
        {/* Left header */}
        <div className="country-header-left me-4 text-center">
          <h3
            className="country-title text-white fw-bold mb-2"
            style={
              noBg
                ? {}
                : {
                    background: gradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }
            }
          >
            {title}
          </h3>

          <Link to={link} className="view-all-btn text-decoration-none d-flex align-items-center">
            <span className="me-2">Xem toàn bộ</span>
            <i className="fas fa-chevron-right"></i>
          </Link>
        </div>

        {/* Right slider */}
        <div className="movies-slider-container flex-grow-1">
          <Swiper
            modules={[Navigation]}
            spaceBetween={20}
            slidesPerView={2}
            breakpoints={{
               0:   { slidesPerView: 2.4, spaceBetween: 10 },  // 320–374
              375: { slidesPerView: 2.6, spaceBetween: 20 },  // iPhone 12/13 mini
              414: { slidesPerView: 2.8, spaceBetween: 30 },  // iPhone 11/Plus
              480: { slidesPerView: 3,   spaceBetween: 30 },  // từ 480px cho đủ 3 cột
              576: { slidesPerView: 3,   spaceBetween: 30 },
              640: { slidesPerView: 3.2, spaceBetween: 20 },
              768: { slidesPerView: 4,   spaceBetween: 14 },  // tablet
              992: { slidesPerView: 4,   spaceBetween: 12 },
              1200:{ slidesPerView: 5,   spaceBetween: 14 },
              1600:{ slidesPerView: 6,   spaceBetween: 16 },
            }}
            navigation={{
              nextEl: `.swiper-button-next-${navKey}`,
              prevEl: `.swiper-button-prev-${navKey}`,
            }}
            className="movies-swiper"
          >
            {movies.map((movie) => (
              <SwiperSlide key={movie.movieId}>
                <div className="movie-card" >
                  <Link to={`/movie/${movie.movieId}`} className="movie-link">
                    <div className="movie-poster-container">
                      <img
                        src={movie.thumbnailUrl}
                        alt={movie.title}
                        className="movie-poster"
                        loading="lazy"
                      />
                      <div className="movie-overlay">
                        <div className="play-icon">
                          <i className="fas fa-play"></i>
                        </div>
                      </div>

                      {movie.movieType === "SERIES" && (
                        <div className="episode-badge">
                          <span className="episode-number">Tập {movie.currentEpisode || 1}</span>
                        </div>
                      )}

                      <div className="quality-badge">
                        <span className="quality">HD</span>
                      </div>
                    </div>

                    <div className="movie-info">
                      <h6 className="movie-title text-white" style={{ fontSize: "0.8rem" }} >{movie.title}</h6>
                      <p className="movie-subtitle text-white" style={{ fontSize: "0.7rem", opacity: 0.8, marginBottom: 0 }} >
                        {movie.originalTitle || movie.description?.substring(0, 20) + "..."}
                      </p>
                    </div>
                  </Link>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* custom nav */}
          <div className={`swiper-button-prev-${navKey} swiper-button-prev-custom`}>
            <i className="fas fa-chevron-left"></i>
          </div>
          <div className={`swiper-button-next-${navKey} swiper-button-next-custom`}>
            <i className="fas fa-chevron-right"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountryMoviesSection;
