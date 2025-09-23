// src/components/Top10MoviesSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import '../css/Top10MoviesSection.css';
import AuthorService from "../services/AuthorService";
import { useAuth } from "../context/AuthContext";
import MovieService from '../services/MovieService';
import WishlistService from "../services/WishlistService";
import { toast } from "react-toastify";

// 👉 Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faCirclePlay, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

const POPUP_W = 480;
const GAP = 12;
const PAD = 8;
const SHOW_DELAY = 1500;
const HIDE_GRACE = 150;

const Top10MoviesSection = () => {
  const { MyUser } = useAuth();
  const [top10Movies, setTop10Movies] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const sliderRef = useRef(null);
  // -------- Wishlist
   const userId = MyUser?.my_user?.userId ?? null;
  const [isInWishlist, setIsInWishlist] = useState(false);

  const [slidesToShow, setSlidesToShow] = useState(5);
  const [startTouch, setStartTouch] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startMouse, setStartMouse] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);

  // Hover/popup
  const [hoveredMovie, setHoveredMovie] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, placement: 'top', transform: 'translate(-50%, -100%)' });
  const hoverTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  //lấy movieid từ popup
  const currentMovieId = hoveredMovie?.movieId || null;

  // Slider calc
  const [slidePx, setSlidePx] = useState(0);
  const [maxSlide, setMaxSlide] = useState(0);
  const isTouchDevice = useRef(false);


  useEffect(() => {
    const updateSlidesToShow = () => {
      const w = window.innerWidth;
      if (w < 576) setSlidesToShow(2);
      else if (w < 768) setSlidesToShow(3);
      else if (w < 992) setSlidesToShow(4);
      else if (w < 1200) setSlidesToShow(5);
      else setSlidesToShow(6);
    };
    updateSlidesToShow();
    window.addEventListener('resize', updateSlidesToShow);
    return () => window.removeEventListener('resize', updateSlidesToShow);
  }, []);

  useEffect(() => {
    isTouchDevice.current = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const all = await MovieService.getAllMovies();
        const sorted = all
          .filter(m => m.viewCount && m.viewCount > 0)
          .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
          .slice(0, 10);
        setTop10Movies(sorted);
      } catch (e) {
        console.error('Error fetching top 10 movies:', e);
        setTop10Movies([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const nextSlide = () => setCurrentSlide(p => Math.min(p + 1, maxSlide));
  const prevSlide = () => setCurrentSlide(p => Math.max(p - 1, 0));

  const calcSlidePx = () => {
    const el = sliderRef.current?.querySelector('.swiper-slide');
    if (!el) return;
    const style = window.getComputedStyle(el);
    const mr = parseFloat(style.marginRight || '0');
    setSlidePx(el.offsetWidth + mr);
  };
  const calcMaxSlide = () => {
    const containerW = sliderRef.current?.clientWidth || 0;
    const totalW = slidePx * top10Movies.length;
    const max = Math.max(0, Math.ceil((totalW - containerW) / slidePx));
    setMaxSlide(max);
  };
  useEffect(() => {
    calcSlidePx();
    const onResize = () => { calcSlidePx(); calcMaxSlide(); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [top10Movies]);
  useEffect(() => { if (slidePx) calcMaxSlide(); }, [slidePx, slidesToShow, top10Movies.length]);

  // Touch/drag
  const handleTouchStart = (e) => setStartTouch(e.touches[0].clientX);
  const handleTouchMove = (e) => {
    if (!startTouch) return;
    const delta = startTouch - e.touches[0].clientX;
    setDragOffset(delta);
    e.preventDefault();
  };
  const handleTouchEnd = (e) => {
    if (!startTouch) return;
    const diff = startTouch - e.changedTouches[0].clientX;
    if (Math.abs(diff) > slidePx * 0.3) {
      if (diff > 0 && currentSlide < maxSlide) setCurrentSlide(s => s + 1);
      if (diff < 0 && currentSlide > 0) setCurrentSlide(s => s - 1);
    }
    setStartTouch(null);
    setDragOffset(0);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setStartMouse(e.clientX);
    setDragOffset(0);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredMovie(null);
    e.preventDefault();
  };
  const handleMouseMove = (e) => {
    if (!isDragging || !startMouse) return;
    setDragOffset(startMouse - e.clientX);
    e.preventDefault();
  };
  const handleMouseUp = () => {
    if (!isDragging) return;
    if (Math.abs(dragOffset) > slidePx * 0.3) {
      if (dragOffset > 0 && currentSlide < maxSlide) setCurrentSlide(s => s + 1);
      if (dragOffset < 0 && currentSlide > 0) setCurrentSlide(s => s - 1);
    }
    setIsDragging(false);
    setStartMouse(null);
    setDragOffset(0);
  };
  const handleMouseLeave = () => { if (isDragging) { setIsDragging(false); setStartMouse(null); setDragOffset(0); } };

  const positionPopup = (elem) => {
    if (!elem || !document.body.contains(elem)) return;
    const rect = elem.getBoundingClientRect();
    let left = rect.left + rect.width / 2;
    left = Math.max(POPUP_W/2 + PAD, Math.min(left, window.innerWidth - POPUP_W/2 - PAD));
    const top = rect.top + rect.height / 2;
    setPopupPos({ top, left, transform: 'translate(-50%, -50%)' });
  };

  const handleMovieEnter = (movie, e) => {
    if (isTouchDevice.current || isDragging) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    const elem = e.currentTarget;
    setAnchorEl(elem);
    hoverTimerRef.current = setTimeout(() => {
      positionPopup(elem);
      setHoveredMovie(movie);
    }, SHOW_DELAY);
  };
  const handleMovieLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setHoveredMovie(null);
      setAnchorEl(null);
    }, HIDE_GRACE);
  };

  useEffect(() => {
    if (!hoveredMovie || !anchorEl) return;
    const onScrollOrResize = () => positionPopup(anchorEl);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [hoveredMovie, anchorEl]);

  const getBadgeInfo = (level) => {
    switch (level) {
      case 'NO_ADS': return { text: 'AD-FREE', class: 'no-ads-badge' };
      case 'PREMIUM': return { text: 'PREMIUM', class: 'premium-badge' };
      case 'MEGA_PLUS': return { text: 'MEGA+', class: 'mega-plus-badge' };
      case 'COMBO_PREMIUM_MEGA_PLUS': return { text: 'COMBO', class: 'combo-badge' };
      default: return null;
    }
  };

    // -------- Wishlist
    useEffect(() => {
      const checkWishlist = async () => {
        if (!userId || !currentMovieId) return;
        const exists = await WishlistService.existsInWishlist(userId, currentMovieId);
        setIsInWishlist(exists);
      };
      checkWishlist();
    }, [userId, currentMovieId]);
  
    const handleToggleWishlist = async () => {
      if (!currentMovieId) return;
      try {
        if (isInWishlist) {
          await WishlistService.removeFromWishlist(userId, currentMovieId);
          toast.success("Đã xóa khỏi danh sách yêu thích");
          setIsInWishlist(false);
        } else {
          await WishlistService.addToWishlist(userId, currentMovieId);
          toast.success("Đã thêm vào danh sách yêu thích");
          setIsInWishlist(true);
        }
      } catch (error) {
        console.error("Lỗi thao tác wishlist:", error);
        toast.error("Thao tác thất bại");
      }
    };

  if (isLoading) {
    return (
      <div className="top10-section">
        <div className="container-xl">
          <div className="top10-header"><h2 className="category-name">Top 10 phim bộ hôm nay</h2></div>
          <div className="top10-loading"><div className="loading-spinner" /></div>
        </div>
      </div>
    );
  }
  if (!top10Movies.length) return null;

  return (
    <div className="top10-section effect-fade-in">
      <div className="container-xl">
        <div className="cards-row cards-slide wide">
          <div className="row-header"><h2 className="category-name">Top 10 phim bộ hôm nay</h2></div>

          <div className="row-content">
            <div className="cards-slide-wrapper top-up">
              <div className="sw-navigation">
                <button type="button" className={`sw-button sw-next ${currentSlide >= maxSlide ? 'swiper-button-disabled' : ''}`}
                        onClick={nextSlide} disabled={currentSlide >= maxSlide}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M5.66675 3.33341L10.3334 8.00008L5.66675 12.6667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button type="button" className={`sw-button sw-prev ${currentSlide <= 0 ? 'swiper-button-disabled' : ''}`}
                        onClick={prevSlide} disabled={currentSlide <= 0}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M10.3335 12.6667L5.66683 8.00004L10.3335 3.33337" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>

              <div
                className="swiper swiper-initialized swiper-horizontal swiper-backface-hidden"
                ref={sliderRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={e => { if (e.button===0) { setIsDragging(true); setStartMouse(e.clientX); setDragOffset(0); e.preventDefault(); } }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                <div
                  className="swiper-wrapper"
                  style={{
                    transform: `translate3d(${-currentSlide * slidePx - (isDragging || startTouch ? dragOffset : 0)}px, 0, 0)`,
                    transitionDuration: (isDragging || startTouch) ? '0ms' : '400ms',
                    transitionTimingFunction: 'cubic-bezier(0.25,0.46,0.45,0.94)'
                  }}
                >
                  {top10Movies.map((movie, index) => {
                    const poster = movie.thumbnailUrl || "https://placehold.co/400x600/0b1220/8aa0b6?text=No+Poster";
                    const badgeInfo = getBadgeInfo(movie.minVipLevel || "FREE");
                    return (
                      <div key={movie.movieId} className="swiper-slide">
                        <div
                          className="sw-item"
                          onMouseEnter={(e) => handleMovieEnter(movie, e)}
                          onMouseLeave={handleMovieLeave}
                        >
                          <Link className="v-thumbnail" to={`/movie/${movie.movieId}`} onClick={() => MovieService.incrementViewCount(movie.movieId)}>
                            <div className="mask"></div>
                            <div>
                              <img
                                alt={`Xem Phim ${movie.title} Vietsub HD Online - CartoonToo`}
                                loading="lazy"
                                src={poster}
                                onError={(ev)=>{ev.currentTarget.src="https://placehold.co/400x600/0b1220/8aa0b6?text=No+Poster";}}
                              />
                            </div>
                          </Link>

                          <div className="info info-v w-chart">
                            <div className="number">{index + 1}</div>
                            <h4 className="item-title lim-1">
                              <Link title={movie.title} to={`/movie/${movie.movieId}`}>{movie.title}</Link>
                            </h4>
                            <div className="alias-title lim-1">{movie.originalTitle || movie.slug || movie.title}</div>
                            <div className="info-line">
                              {badgeInfo && <div className={`tag-small ${badgeInfo.class}`}><strong>{badgeInfo.text}</strong></div>}
                              <div className="tag-small"><strong>T{movie.ageRating || '13'}</strong></div>
                              <div className="tag-small">Phần {movie.season || '1'}</div>
                              <div className="tag-small">Tập {movie.currentEpisode || movie.totalEpisodes || '1'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Popup (portal) */}
              {hoveredMovie && createPortal(
                <div
                  className="movie-preview-popup show"
                  style={{ position: 'fixed', top: popupPos.top, left: popupPos.left, transform: popupPos.transform, width: POPUP_W }}
                  onMouseEnter={() => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }}
                  onMouseLeave={() => { setHoveredMovie(null); setAnchorEl(null); }}
                >
                  <div style={{ height: 220, overflow: 'hidden', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                    <img
                      src={hoveredMovie.bannerUrl || hoveredMovie.thumbnailUrl}
                      alt={hoveredMovie.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => { e.currentTarget.src = hoveredMovie.thumbnailUrl || 'https://placehold.co/600x300/0b1220/8aa0b6?text=No+Image'; }}
                    />
                  </div>

                  <div className="preview-content" style={{ padding: '12px 16px' }}>
                    <div className="preview-poster" style={{ width: 120, height: 180 }}>
                      <img
                        src={hoveredMovie.thumbnailUrl}
                        alt={hoveredMovie.title}
                        onError={(e)=>{e.currentTarget.src='https://placehold.co/120x180/0b1220/8aa0b6?text=No+Poster'}}
                      />
                    </div>

                    <div className="preview-info">
                      <h3 className="preview-title">{hoveredMovie.title}</h3>
                      <div className="preview-original-title">{hoveredMovie.originalTitle || hoveredMovie.slug}</div>
                      <div className="preview-meta">
                        <div className="preview-tag">T{hoveredMovie.ageRating || '13'}</div>
                        <div className="preview-tag">{hoveredMovie.releaseYear}</div>
                        <div className="preview-tag">{hoveredMovie.country}</div>
                      </div>

                      {/* >>> NÚT HÀNH ĐỘNG với Font Awesome */}
                      <div className="preview-actions">
                        <Link
                          to={`/movie/${hoveredMovie.movieId}`}
                          className="preview-btn primary"
                          onClick={() => MovieService.incrementViewCount(hoveredMovie.movieId)}
                        >
                          <FontAwesomeIcon icon={faCirclePlay} />
                          Xem ngay
                        </Link>

                        <button
                          type="button"
                          className={`preview-btn secondary ${isInWishlist ? 'is-liked' : ''}`}
                          aria-pressed={isInWishlist}
                          onClick={() => handleToggleWishlist()}
                        >
                          <FontAwesomeIcon icon={faHeart} />
                          {isInWishlist ? 'Đã thích' : 'Thích'}
                        </button>

                        <Link
                          to={`/movie/${hoveredMovie.movieId}`}
                          className="preview-btn secondary"
                          aria-label="Chi tiết"
                        >
                          <FontAwesomeIcon icon={faCircleInfo} />
                          Chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Top10MoviesSection;
