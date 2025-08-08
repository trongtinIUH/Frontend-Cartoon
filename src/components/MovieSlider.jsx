import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Carousel from 'react-bootstrap/Carousel';
import MovieService from '../services/MovieService';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faHeart } from "@fortawesome/free-solid-svg-icons";
import 'bootstrap/dist/css/bootstrap.min.css';

const MovieSlider = () => {
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
 const [translatedTitles, setTranslatedTitles] = useState({});

  // Function translate Vietnamese to English
  const translateToEnglish = async (vietnameseText) => {
    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(vietnameseText)}`);
      const data = await response.json();
      return data[0][0][0]; // Lấy text đã translate
    } catch (error) {
      console.error('Translation error:', error);
      return vietnameseText; // Fallback về text gốc
    }
  };
    // Function để translate title khi component mount
  useEffect(() => {
    const translateTitles = async () => {
      const translations = {};
      
      for (const movie of featuredMovies) {
        if (movie.title && !movie.aliasTitle) {
          const englishTitle = await translateToEnglish(movie.title);
          translations[movie.movieId] = englishTitle;
        }
      }
      
      setTranslatedTitles(translations);
    };

    if (featuredMovies.length > 0) {
      translateTitles();
    }
  }, [featuredMovies]);

  useEffect(() => {
    async function fetchFeaturedMovies() {
      try {
        const movies = await MovieService.getPopularMovies();
        setFeaturedMovies(movies.slice(0, 6));
      } catch (error) {
        console.error("Error fetching featured movies:", error);
      }
    }
    fetchFeaturedMovies();
  }, []);

  if (featuredMovies.length === 0) return null;

  return (
    <div id="top_slide" style={{position: 'relative', minHeight: 500, paddingTop: 70}}>
      <div className="slide-wrapper top-slide-wrap" style={{position: 'relative', minHeight: 500}}>
        <Carousel
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
          fade
          controls={false}
          indicators={false}
          interval={5000}
          className="top-slide-main"
        >
          {featuredMovies.map((movie, idx) => (
            <Carousel.Item key={movie.movieId} style={{height: 500, position: "relative"}}>
              {/* Background blur */}
              <div
                className="background-fade"
                style={{
                  backgroundImage: `url(${movie.backgroundUrl || movie.thumbnailUrl})`,
                  position: 'absolute',
                  top: 0, left: 0, width: '100%', height: '100%',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'brightness(0.6)',
                  zIndex: 1,
                  transition: 'background-image 0.5s'
                }}
              />
              {/* Gradient overlay for better text contrast */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                 background: 'linear-gradient(90deg, rgba(20,20,20,0.38) 20%, rgba(20,20,20,0.01) 88%)',
                zIndex: 2
              }} />

              {/* Slide Content */}
              <div className="safe-area"
                   style={{
                     position: 'relative', zIndex: 3, height: '100%',
                     display: 'flex', alignItems: 'center', paddingLeft: 18
                   }}>
                <div className="slide-content" style={{maxWidth: 580, color: 'white'}}>
                  {/* Logo/title image */}
                  <div className="media-title-image" style={{marginBottom: 15}}>
                    {movie.titleImageUrl ? (
                      <img alt={movie.title} src={movie.titleImageUrl}
                           style={{maxWidth: 350, maxHeight: 120}} />
                    ) : (
                      <h3 style={{
                        fontSize: 25,
                        fontWeight: 800,
                        textShadow: '2px 2px 6px #000'
                      }}>{movie.title}</h3>
                    )}
                  </div>
                  <h3 className="media-alias-title"
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        marginBottom: 10,
                        letterSpacing: 1
                      }}>
                    <Link to={`/movie/${movie.movieId}`}
                          style={{color: '#fff', textDecoration: 'none', textShadow: '1px 1px 5px #000'}}>
                       {movie.aliasTitle || translatedTitles[movie.movieId] || movie.title}
                    </Link>
                  </h3>
                  {/* Tag row */}
                  <div className="hl-tags mb-3"
                       style={{display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14}}>
                    {movie.imdb && (
                      <div className="tag-imdb"
                           style={{
                             padding: '2px 8px', background: '#f5c518',
                             color: '#222', borderRadius: 4, fontWeight: 700, fontSize: '1rem'
                           }}>
                        IMDb <span>{movie.imdb}</span>
                      </div>
                    )}
                    {movie.age && (
                      <div className="tag-model"
                           style={{
                             padding: '2px 8px',
                             background: 'rgba(255,255,255,0.10)', color: '#fff',
                             borderRadius: 4
                           }}>
                        <span className="last"><strong>{movie.age}</strong></span>
                      </div>
                    )}
                    {movie.year && (
                      <div className="tag-classic"
                           style={{
                             padding: '2px 8px',
                             background: 'rgba(255,255,255,0.10)', color: '#fff',
                             borderRadius: 4
                           }}>
                        <span>{movie.year}</span>
                      </div>
                    )}
                    {movie.season && (
                      <div className="tag-classic"
                           style={{
                             padding: '2px 8px',
                             background: 'rgba(255,255,255,0.10)', color: '#fff',
                             borderRadius: 4
                           }}>
                        <span>{movie.season}</span>
                      </div>
                    )}
                    {movie.episode && (
                      <div className="tag-classic"
                           style={{
                             padding: '2px 8px',
                             background: 'rgba(255,255,255,0.10)', color: '#fff',
                             borderRadius: 4
                           }}>
                        <span>{movie.episode}</span>
                      </div>
                    )}
                  </div>
                  {/* Thể loại row */}
                  <div className="hl-tags mb-4"
                       style={{display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12}}>
                    {movie.genres?.map((genre, idx) => (
                      <Link key={idx} to={`/genre/${genre.slug || genre}`}
                            className="tag-topic"
                            style={{
                              padding: '2px 12px',
                              background: 'rgba(255,255,255,0.08)',
                              color: '#fff', borderRadius: 5,
                              textDecoration: 'none', fontSize: 12, marginBottom: 4,
                              transition: 'background 0.2s'
                            }}>
                        {genre.name || genre}
                      </Link>
                    ))}
                  </div>
                  {/* Mô tả */}
                  <div className="description lim-3"
                       style={{
                         fontSize: 12, lineHeight: 1.6,
                         marginBottom: 24, opacity: 0.94,
                         display: '-webkit-box',
                         WebkitLineClamp: 3,
                         WebkitBoxOrient: 'vertical',
                         overflow: 'hidden',
                         textShadow: '1px 1px 7px #111'
                       }}>
                    {movie.description || "Không có mô tả cho phim này."}
                  </div>
                  {/* Button & action */}
                  <div className="touch" style={{display: 'flex', alignItems: 'center', gap: 24}}>
                    <Link className="button-play"
                          to={`/movie/${movie.movieId}`}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 54, height: 54, fontSize: 28,
                            backgroundColor: '#e50914', borderRadius: '50%',
                            color: 'white', boxShadow: '0 4px 18px #000a', transition: 'transform 0.23s'
                          }}>
                      <FontAwesomeIcon icon={faPlay}/>
                    </Link>
                    <button className="btn btn-icon" style={{
                      background: 'rgba(255,255,255,0.09)', border: 'none', color: '#fff',
                      width: 45, height: 45, borderRadius: '50%', fontSize: 22
                    }}>
                      <FontAwesomeIcon icon={faHeart}/>
                    </button>
                  </div>
                </div>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
        {/* Thumbnail navigation */}
        <div className="top-slide-small"
             style={{
               display: 'flex',
               position: 'absolute', bottom: 16, right: 40, zIndex: 30,
               gap: 8
             }}>
          {featuredMovies.map((movie, idx) => (
            <img
              key={movie.movieId}
              alt={`Xem Phim ${movie.title}`}
              loading="lazy"
              src={movie.thumbnailSmallUrl || movie.thumbnailUrl}
              onClick={() => setActiveIndex(idx)}
              style={{
                width: 65, height: 45, objectFit: 'cover',
                borderRadius: 6, cursor: 'pointer',
                border: activeIndex === idx ? '2.5px solid #fff' : '2.5px solid transparent',
                opacity: activeIndex === idx ? 1 : 0.7,
                boxShadow: activeIndex === idx ? '0 0 10px #fff7' : undefined,
                transition: 'opacity 0.2s, border 0.2s, box-shadow 0.2s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieSlider;
