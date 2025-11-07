import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/Header.css";
import showToast from "../utils/AppUtils";
import GENRES from "../constants/genres";
import TOPICS from "../constants/topics";
import ModelAddMovie from "../models/ModelAddMovie";
import MovieService from "../services/MovieService";
import { trackSignal, getCurrentUserId } from "../services/personalizationService";
import { debounce } from "lodash";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Funnel } from "lucide-react"; // Assuming you have lucide-react installed for icons
import {
  faCrown, faWallet, faHeart, faListUl, faClock, faUser,
  faRightFromBracket, faPlus,
  faH,
  faHistory
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Logo from "./Logo";
import default_avatar from "../image/default_avatar.jpg"
import { COUNTRIES } from "../constants/countries";


const Header = ({ fetchMovies, setFilteredMovies }) => {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterMonth, setFilterMonth] = useState(0); // 0 nghĩa là không chọn
  const [filterYear, setFilterYear] = useState(0);  // 0 nghĩa là không chọn  

  const navigate = useNavigate();
  const { MyUser } = useAuth();
  const user = MyUser?.my_user || {};
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || "");
  const [showAddMovie, setShowAddMovie] = useState(false);
  const isAdmin = MyUser?.my_user?.role === "ADMIN";
  const isUser = MyUser?.my_user?.role === "USER";
  const isLoggedIn = Boolean(MyUser?.my_user?.userId || MyUser?.idToken);
  const [showGenres, setShowGenres] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [showCountries, setShowCountries] = useState(false);


  //set cho mobie 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);


  const debouncedSearch = debounce(async (value) => {
    if (!value.trim()) return;
    
    // 🎯 Track search query
    const userId = getCurrentUserId();
    if (userId) {
      trackSignal(userId, 'search_query', null, {
        query: value,
        source: 'header_search',
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      const res = await MovieService.searchMovies(value);
      setSuggestions(res);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, 300);

  const handleLogout = () => {
    localStorage.removeItem("idToken");
    localStorage.removeItem("my_user");
    localStorage.removeItem("phoneNumber");
    localStorage.removeItem("userAttributes");
    window.location.replace("/");
  };

  //load trang
  const reloadMainPage = () => {
    if (typeof fetchMovies === "function") {
      fetchMovies();
    }
    // Scroll to top khi về trang chủ
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Tìm phim theo chủ đề
  const handleTopicSearch = async (topic) => {
    try {
      const movies = await MovieService.getMovieByTopic(topic);
      if (typeof setFilteredMovies === "function" && Array.isArray(movies)) {
        setFilteredMovies(movies);
        showToast(`Tìm thấy ${movies.length} phim với chủ đề "${topic}"`, "success");
      }
      // Đóng dropdown
      setShowTopics(false);
      setIsMobileMenuOpen(false);
    } catch (error) {
      showToast(`Không thể tìm phim với chủ đề "${topic}"`, "error");
    }
  };

  //ẩn header khi cuộn xuống
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const controlHeader = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setShowHeader(false); // cuộn xuống → ẩn header
    } else {
      setShowHeader(true);  // cuộn lên → hiện header
    }

    setLastScrollY(currentScrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", controlHeader);
    return () => window.removeEventListener("scroll", controlHeader);
  }, [lastScrollY]);

  // Track whether page has been scrolled away from top to toggle background
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  // state menbership của user:
  const [openUserPanel, setOpenUserPanel] = useState(false);
  const closeUserPanel = () => setOpenUserPanel(false);
  const go = (path) => {
    navigate(path);
    closeUserPanel();
  };

  // click outside để đóng (optional nhưng nên có)
  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest?.('.user-menu')) setOpenUserPanel(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);


  return (
    <>
  <header className={`main-header ${showHeader ? "" : "hidden-header"} ${isScrolled ? "scrolled" : ""}`}>
        <div className="header-container">
          {/* --- LEFT: Logo + Menu + Search + Nav --- */}
          <div className="header-left">
            {/* Hamburger - mobile only, left side */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              ☰
            </button>

            {/* Logo - center on mobile, left on desktop */}
            <Link to="/main" className="logo-wrap" onClick={reloadMainPage}>
              <img
                src={`${process.env.PUBLIC_URL}/image/cartoonToo.png`}
                alt=""
                style={{ borderRadius: 7, width: 50, height: 40 }}
              />
            </Link>

            {/* Search - desktop only (full input) */}
            <div className="search-container desktop-search">
              <input
                type="text"
                placeholder="Tìm kiếm phim..."
                value={searchText}
                onChange={async (e) => {
                  const value = e.target.value;
                  setSearchText(value);
                  debouncedSearch?.(value);
                  if (value.trim() === "") {
                    setSuggestions?.([]);
                    setShowSuggestions?.(false);
                    return;
                  }
                }}
                onFocus={() => {
                  if (suggestions?.length > 0) setShowSuggestions?.(true);
                }}
                onBlur={() => {
                  // trì hoãn để kịp click item
                  setTimeout(() => setShowSuggestions?.(false), 150);
                }}
                className="search-input"
              />

              {showSuggestions && suggestions?.length > 0 && (
                <ul className="search-suggestions">
                  {suggestions.slice(0, 6).map((movie) => (
                    <li key={movie.movieId} className="suggestion-item">
                      <Link
                        to={`/movie/${movie.movieId}`}
                        className="suggestion-link"
                        onClick={() => setShowSuggestions?.(false)}
                      >
                        <img
                          src={movie.thumbnailUrl}
                          alt={movie.title}
                          className="suggestion-img"
                        />
                        <span className="suggestion-title">{movie.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Main Nav */}
            <nav className={`nav-links ${isMobileMenuOpen ? "open" : ""}`}>
              
              {/* User Section ở đầu menu - CHỈ HIỆN TRÊN MOBILE */}
              <div className="mobile-user-section">
                <img 
                  src={avatarPreview || default_avatar} 
                  alt="avatar" 
                  className="mobile-user-avatar"
                />
                <div className="mobile-user-info">
                  <div className="mobile-user-name">
                    {isLoggedIn ? user.userName || "Thành viên" : "Khách"}
                  </div>
                  <div className="mobile-user-role">
                    CartoonToo
                  </div>
                </div>
              </div>

              {/* Grid 2 cột cho Phim Lẻ/Phim Bộ - CHỈ TRÊN MOBILE */}
              <div className="mobile-movie-types">
                <Link to="/danh-muc/type/SINGLE" onClick={() => setIsMobileMenuOpen(false)} className="mobile-type-btn">
                  Phim Lẻ
                </Link>
                <Link to="/danh-muc/type/SERIES" onClick={() => setIsMobileMenuOpen(false)} className="mobile-type-btn">
                  Phim Bộ
                </Link>
              </div>

              {/* Desktop nav items */}
              <Link to="/danh-muc/type/SINGLE" onClick={() => setIsMobileMenuOpen(false)} className="desktop-nav-item">
                Phim lẻ
              </Link>
              <Link to="/danh-muc/type/SERIES" onClick={() => setIsMobileMenuOpen(false)} className="desktop-nav-item">
                Phim bộ
              </Link>
              <Link to="/rooms" onClick={() => setIsMobileMenuOpen(false)} className="mobile-menu-item">
                Xem chung
              </Link>


              {/* CHỦ ĐỀ dropdown (PC hover, mobile click) */}
              <div
                className="topic-menu-wrapper mobile-menu-item"
                onMouseEnter={() => !isMobileMenuOpen && setShowTopics(true)}
                onMouseLeave={() => !isMobileMenuOpen && setShowTopics(false)}
                onClick={() => isMobileMenuOpen && setShowTopics((prev) => !prev)}
              >
                <span style={{ fontWeight: 500, cursor: "pointer" }}>Chủ đề</span>
                {showTopics && (
                  <div className={`topics-dropdown ${showTopics ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
                    <ul>
                      {TOPICS.map((topic, i) => (
                        <li key={i}>
                          <Link to={`/danh-muc/chu-de/${encodeURIComponent(topic)}`} onClick={() => setIsMobileMenuOpen(false)}>
                            {topic}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
             {/* QUỐC GIA dropdown (PC hover, mobile click) */}
              <div
                className="country-menu-wrapper mobile-menu-item"
                onMouseEnter={() => !isMobileMenuOpen && setShowCountries(true)}
                onMouseLeave={() => !isMobileMenuOpen && setShowCountries(false)}
                onClick={() => isMobileMenuOpen && setShowCountries(prev => !prev)}
              >
                <span style={{ fontWeight: 500, cursor: "pointer" }}>Quốc gia</span>
                {showCountries && (
                  <div
                    className={`countries-dropdown ${showCountries ? "open" : ""}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ul>
                      {COUNTRIES.map((c, i) => (
                        <li key={i}>
                          <Link
                            to={`/danh-muc/quoc-gia/${encodeURIComponent(c.value)}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {/* Thể loại dropdown (PC hover, mobile click) */}
              <div
                className="genre-menu-wrapper mobile-menu-item"
                onMouseEnter={() => !isMobileMenuOpen && setShowGenres(true)}
                onMouseLeave={() => !isMobileMenuOpen && setShowGenres(false)}
                onClick={() => isMobileMenuOpen && setShowGenres((prev) => !prev)}
              >
                <span style={{ fontWeight: 500, cursor: "pointer" }}>Thể loại</span>
                {showGenres && (
                  <div className={`genres-dropdown ${showGenres ? "open" : ""}`} onClick={(e) => e.stopPropagation()}>
                    <ul>
                      {GENRES.map((genre, i) => (
                        <li key={i}><Link to={`/danh-muc/the-loai/${genre}`} onClick={() => setIsMobileMenuOpen(false)}>{genre}</Link></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Link
                to="/buy-package"
                className="menu-cta"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Mua gói
              </Link>
            </nav>
          </div>

          {/* --- RIGHT: Filter + Buy + User --- */}
          <div className="header-right">
            {/* Search Icon cho mobile */}
            <button 
              className="mobile-search-toggle"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              🔍
            </button>

            {/* Mua Gói */}
            <Link to="/buy-package" className="buy-package-btn">
              <FontAwesomeIcon
                icon={faWallet}
                style={{ marginRight: "5px" }}
              />
              Mua Gói
            </Link>

            {/* USER MENU (hover desktop, click mobile) */}
            <div
              className="user-menu"
              onMouseEnter={() =>
                window.innerWidth > 768 && setOpenUserPanel(true)
              }
              onClick={() =>
                window.innerWidth <= 768 &&
                setOpenUserPanel((v) => !v)
              }
            >
              {/* VIP badge cạnh avatar */}


              <img
                src={avatarPreview || default_avatar}
                alt="avatar"
                className="user-avatar"
              />

              {/* Panel */}
              {openUserPanel && (
                <div className="user-panel">
                  {/* Header */}
                  <div className="user-panel__header">
                    <img
                      src={avatarPreview || default_avatar}
                      alt="avatar"
                      className="user-panel__avatar"
                    />
                    <div className="user-panel__info">
                      <div className="user-panel__name">
                        {isLoggedIn
                          ? MyUser?.my_user?.userName || "Người dùng"
                          : "Khách"}
                      </div>
                      <div className="user-panel__sub">
                        {isLoggedIn
                          ? "Mua gói để có trải nghiệm tốt hơn."
                          : "Đăng nhập để đồng bộ lịch sử và danh sách yêu thích."}
                      </div>
                    </div>
                  </div>

                  <hr />

                  {/* Nếu CHƯA login -> chỉ hiện nút đăng nhập */}
                  {!isLoggedIn ? (
                    <>
                      <button
                        className="btn btn-watch"
                        onClick={() => go("/")}
                      >
                        Đăng nhập
                      </button>
                      <div className="user-panel__arrow" />
                    </>
                  ) : (
                    <>
                      {/* Actions */}
                      <ul className="user-panel__list">
                        <li onClick={() => go("/favorites")}>
                          <FontAwesomeIcon icon={faHeart} />{" "}
                          <span>Danh sách yêu thích</span>
                        </li>
                        <li onClick={() => go("/purchase-history")}>
                          <FontAwesomeIcon icon={faHistory} />{" "}
                          <span>Lịch sử thanh toán</span>
                        </li>
                        {/* <li onClick={() => go("/continue")}>
                          <FontAwesomeIcon icon={faClock} />{" "}
                          <span>Xem tiếp</span>
                        </li> */}
                        <li onClick={() => go("/profile")}>
                          <FontAwesomeIcon icon={faUser} />{" "}
                          <span>Tài khoản</span>
                        </li>
                        <hr />
                        <li className="danger" onClick={handleLogout}>
                          <FontAwesomeIcon icon={faRightFromBracket} />{" "}
                          <span>Thoát</span>
                        </li>

                      
                        {isAdmin && (
                          <>
                            
                            <li onClick={() => go('/admin-movie')}>
                              Bảng điều khiển
                            </li>
                          </>
                        )}
                      </ul>

                      <div className="user-panel__arrow" />
                    </>
                  )}
                </div> // ✅ ĐÃ đóng .user-panel đúng chỗ
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Filter Modal */}
      {setFilteredMovies && showFilter && (
        <div className="filter-overlay" onClick={() => setShowFilter(false)}>
          <div className="filter-box" onClick={(e) => e.stopPropagation()}>
            <h5>Lọc Phim</h5>

            <div className="filter-fields">
              <div className="select-group">
                <div className="select-item">
                  <label>Tháng:</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(Number(e.target.value))}
                  >
                    <option value={0}>-- trống --</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-item">
                  <label>Năm:</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(Number(e.target.value))}
                  >
                    <option value={0}>-- trống --</option>
                    {Array.from({ length: 50 }, (_, i) => {
                      const year = 2000 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            <div className="filter-actions">
              <button
                className="btn-filter"
                onClick={async () => {
                  const result = await MovieService?.filterMoviesByYearAndMonth(
                    filterYear || 0,
                    filterMonth || 0
                  );
                  if (Array.isArray(result) && result.length > 0) {
                    setFilteredMovies(result);
                    showToast?.("Đã lọc phim!", "success");
                  } else {
                    setFilteredMovies([]);
                    showToast?.("Không tìm thấy phim phù hợp", "error");
                  }
                }}
              >
                Lọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="mobile-search-overlay" onClick={() => setIsMobileSearchOpen(false)}>
          <div className="mobile-search-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-search-header">
              <input
                type="text"
                placeholder="Tìm kiếm phim..."
                value={searchText}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchText(value);
                  debouncedSearch?.(value);
                  if (value.trim() === "") {
                    setSuggestions?.([]);
                    setShowSuggestions?.(false);
                  }
                }}
                className="mobile-search-input"
                autoFocus
              />
              <button 
                className="mobile-search-close"
                onClick={() => setIsMobileSearchOpen(false)}
              >
                ✕
              </button>
            </div>
            
            {suggestions?.length > 0 && (
              <ul className="mobile-search-results">
                {suggestions.slice(0, 6).map((movie) => (
                  <li key={movie.movieId} className="mobile-search-item">
                    <Link
                      to={`/movie/${movie.movieId}`}
                      className="mobile-search-link"
                      onClick={() => {
                        setIsMobileSearchOpen(false);
                        setShowSuggestions(false);
                      }}
                    >
                      <img
                        src={movie.thumbnailUrl}
                        alt={movie.title}
                        className="mobile-search-img"
                      />
                      <span className="mobile-search-title">{movie.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Add Movie Modal */}
      {showAddMovie && (
        <div
          className="modaladd-backdrop-custom"
          onClick={() => setShowAddMovie(false)}
        >
          <div
            className="modaladd-content-custom"
            onClick={(e) => e.stopPropagation()}
          >
            <ModelAddMovie
              onSuccess={() => {
                setShowAddMovie(false);
                fetchMovies?.();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Header;