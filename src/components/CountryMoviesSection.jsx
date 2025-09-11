import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import MovieService from "../services/MovieService";
import {Link} from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/CountryMoviesSection.css";

const CountryMoviesSection = ({ title, country, countries, link, gradient }) => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        let allMovies = [];
        
        // Nếu có countries array, lấy phim từ nhiều quốc gia
        if (countries && Array.isArray(countries)) {
          const promises = countries.map(countryName => 
            MovieService.getMoviesByCountry(countryName)
          );
          const results = await Promise.all(promises);
          
          // Gộp tất cả kết quả lại
          allMovies = results.flat().filter(movie => movie);
          
          // Loại bỏ trùng lặp dựa trên movieId
          const uniqueMovies = allMovies.filter((movie, index, self) => 
            index === self.findIndex(m => m.movieId === movie.movieId)
          );
          
          setMovies(uniqueMovies);
        } 
        // Nếu chỉ có 1 country, sử dụng logic cũ
        else if (country) {
          const res = await MovieService.getMoviesByCountry(country);
          setMovies(Array.isArray(res) ? res : []);
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
        setMovies([]);
      }
    };

    fetchMovies();
  }, [country, countries]);

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
          }}
            >
            {title}
          </h3>
          <Link
            to={link}
            className="view-all-btn text-decoration-none d-flex align-items-center"
          >
            <span className="me-2">Xem toàn bộ</span>
            <i className="fas fa-chevron-right"></i>
          </Link>
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
              nextEl: `.swiper-button-next-${title.replace(/\s+/g, '-')}`,
              prevEl: `.swiper-button-prev-${title.replace(/\s+/g, '-')}`,
            }}
            className="movies-swiper"
          >
            {movies.map((movie) => (
              <SwiperSlide key={movie.movieId}>
                <div className="movie-card">
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
                      
                      {/* Episode Badge - chỉ hiển thị cho SERIES */}
                      {movie.movieType === "SERIES" && (
                        <div className="episode-badge">
                          <span className="episode-number">
                            Tập {movie.currentEpisode || 1}
                          </span>
                        </div>
                      )}

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
                  </Link>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Buttons */}
          <div className={`swiper-button-prev-${title.replace(/\s+/g, '-')} swiper-button-prev-custom`}>
            <i className="fas fa-chevron-left"></i>
          </div>
          <div className={`swiper-button-next-${title.replace(/\s+/g, '-')} swiper-button-next-custom`}>
            <i className="fas fa-chevron-right"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountryMoviesSection;