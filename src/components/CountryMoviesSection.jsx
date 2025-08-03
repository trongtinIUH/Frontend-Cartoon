import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import MovieService from "../services/MovieService";
import "swiper/css";
import "swiper/css/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/CountryMoviesSection.css";

const CountryMoviesSection = ({ title, country, link, gradient }) => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    MovieService.getMoviesByCountry(country)
      .then((res) => {
        if (Array.isArray(res)) {
          setMovies(res);
        } else {
          setMovies([]);
        }
      })
      .catch(() => setMovies([]));
  }, [country]);

  return (
    <div className="country-movies-section mb-4">
      <div className="wapper d-flex  align-items-center" style={{borderRadius: "10px"}}>
        {/* Title Section - bên trái */}
        <div className="country-header-left me-4 text-center">
          <h3 className="country-title text-white fw-bold mb-2"
          style={{
            background: gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            width:"150px"
          }}
            >
            {title}
          </h3>
          <a
            href={link}
            className="view-all-btn text-decoration-none d-flex align-items-center"
          >
            <span className="me-2">Xem toàn bộ</span>
            <i className="fas fa-chevron-right"></i>
          </a>
        </div>

        {/* Movies Slider - bên phải, chiếm phần còn lại */}
        <div className="movies-slider-container flex-grow-1">
          <Swiper
            modules={[Navigation]}
            spaceBetween={16}
            slidesPerView={2}
            breakpoints={{
              576: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              992: { slidesPerView: 5 },
              1200: { slidesPerView: 6 }
            }}
            navigation={{
              nextEl: `.swiper-button-next-${country}`,
              prevEl: `.swiper-button-prev-${country}`,
            }}
            className="movies-swiper"
          >
            {movies.map((movie) => (
              <SwiperSlide key={movie.movieId}>
                <div className="movie-card">
                  <a href={`/phim/${movie.slug}`} className="movie-link">
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
                      
                      {/* Episode Badge */}
                      <div className="episode-badge">
                        <span className="episode-number">
                          Tập {movie.currentEpisode || 1}
                        </span>
                      </div>

                      {/* Quality Badge */}
                      <div className="quality-badge">
                        <span className="quality">HD</span>
                      </div>
                    </div>
                    
                    <div className="movie-info">
                      <h6 className="movie-title text-white">
                        {movie.title}
                      </h6>
                      <p className="movie-subtitle text-white">
                        {movie.originalTitle || movie.description?.substring(0, 30) + "..."}
                      </p>
                    </div>
                  </a>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Buttons */}
          <div className={`swiper-button-prev-${country} swiper-button-prev-custom`}>
            <i className="fas fa-chevron-left"></i>
          </div>
          <div className={`swiper-button-next-${country} swiper-button-next-custom`}>
            <i className="fas fa-chevron-right"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountryMoviesSection;