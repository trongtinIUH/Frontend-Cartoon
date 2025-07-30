import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, EffectFade, Autoplay } from 'swiper/modules';
import MovieService from '../services/MovieService';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/effect-fade';
import '../css/MovieSlider.css';

const MovieSlider = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  useEffect(() => {
    async function fetchFeaturedMovies() {
      try {
        // Lấy 6 phim nổi bật (có thể thay đổi logic tùy theo API)
        const movies = await MovieService.getPopularMovies();
        setFeaturedMovies(movies.slice(0, 6)); // Lấy 6 phim đầu
      } catch (error) {
        console.error("Error fetching featured movies:", error);
      }
    }
    
    fetchFeaturedMovies();
  }, []);

  if (featuredMovies.length === 0) return null;

  return (
    <div className="slide-wrapper top-slide-wrap">
      <Swiper
        modules={[Navigation, Thumbs, EffectFade, Autoplay]}
        effect="fade"
        spaceBetween={0}
        slidesPerView={1}
        thumbs={{ swiper: thumbsSwiper }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        className="top-slide-main"
        lazy={true}
      >
        {featuredMovies.map((movie) => (
          <SwiperSlide key={movie.movieId}>
            <div className="slide-elements">
              <Link className="slide-url" to={`/movie/${movie.movieId}`}></Link>
              <div 
                className="background-fade" 
                style={{ backgroundImage: `url(${movie.thumbnailUrl})` }}
              ></div>
              <div className="cover-fade">
                <div className="cover-image">
                  <img 
                    className="fade-in visible" 
                    title={movie.title} 
                    loading="lazy" 
                    src={movie.thumbnailUrl} 
                    alt={movie.title}
                  />
                </div>
              </div>
              <div className="safe-area">
                <div className="slide-content">
                  <div className="media-item">
                    <div className="media-title-image">
                      <Link title={movie.title} to={`/movie/${movie.movieId}`}>
                        <img alt={movie.title} src={movie.thumbnailUrl} />
                      </Link>
                    </div>
                    <h3 className="media-title" style={{ display: "none" }}>
                      <Link title={movie.title} to={`/movie/${movie.movieId}`}>{movie.title}</Link>
                    </h3>
                    <h3 className="media-alias-title">
                      <Link title={movie.title} to={`/movie/${movie.movieId}`}>{movie.title}</Link>
                    </h3>
                    <div className="hl-tags">
                      <div className="tag-imdb"><span>8.0</span></div>
                      <div className="tag-quality"><span>HD</span></div>
                      <div className="tag-model"><span className="last"><strong>T13</strong></span></div>
                    </div>
                    <div className="hl-tags mb-4">
                      {movie.genres?.map((genre, idx) => (
                        <Link key={idx} className="tag-topic" to={`/genre/${genre}`}>{genre}</Link>
                      ))}
                    </div>
                    <div className="description lim-3">
                      {movie.description || "Không có mô tả cho phim này."}
                    </div>
                    <div className="touch">
                      <Link className="button-play" to={`/movie/${movie.movieId}`}>
                       <FontAwesomeIcon icon={faPlay} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      <Swiper
        modules={[Thumbs]}
        watchSlidesProgress
        onSwiper={setThumbsSwiper}
        spaceBetween={5}
        slidesPerView={6}
        className="top-slide-small"
      >
        {featuredMovies.map((movie) => (
          <SwiperSlide key={movie.movieId}>
            <img 
              alt={`Xem Phim ${movie.title}`} 
              loading="lazy" 
              src={movie.thumbnailUrl} 
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MovieSlider;