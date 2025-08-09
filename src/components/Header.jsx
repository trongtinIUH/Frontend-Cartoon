import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/Header.css";
import showToast from "../utils/AppUtils";
import GENRES from "../constants/genres";
import ModelAddMovie from "../models/ModelAddMovie";
import MovieService from "../services/MovieService";
import { debounce } from "lodash";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Funnel } from "lucide-react"; // Assuming you have lucide-react installed for icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faMedal ,faWallet} from "@fortawesome/free-solid-svg-icons"; // Import specific icon



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
  const [showGenres, setShowGenres] = useState(false);

  //set cho mobie 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const debouncedSearch = debounce(async (value) => {
    if (!value.trim()) return;
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
    navigate("/");
  };
  const handleLogin = () => {
    navigate("/");
  };

  //load trang
const reloadMainPage = () => {
  if (typeof fetchMovies === "function") {
    fetchMovies();
  }
};

//ẩn header khi cuộn xuống
const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  return (
 <>
  <header className={`main-header ${showHeader ? "" : "hidden-header"}`}>
    <div className="header-container">
      {/* --- LEFT: Logo + Menu --- */}
      <div className="header-left">
        <Link to="/main" className="logo-wrap" onClick={reloadMainPage}>
          <img
            src={process.env.PUBLIC_URL + "/image/cartoonToo.png"}
            alt="Logo"
            className="logo"
          />
        </Link>
        {/* Hamburger only on mobile */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </button>

        <nav className={`nav-links ${isMobileMenuOpen ? "open" : ""}`}>
          <Link to="/main" onClick={reloadMainPage}>Trang chủ</Link>
          <Link to="/main" onClick={reloadMainPage}>Chủ đề</Link>
          <Link to="/main" onClick={reloadMainPage}>Phim bộ</Link>
          {/* Thể loại dropdown (PC hover, mobile click) */}
          <div
            className="genre-menu-wrapper"
            onMouseEnter={() => !isMobileMenuOpen && setShowGenres(true)}
            onMouseLeave={() => !isMobileMenuOpen && setShowGenres(false)}
            onClick={() => isMobileMenuOpen && setShowGenres(!showGenres)}
          >
            <span style={{ fontWeight: "500", cursor: "pointer" }}>Thể loại</span>
            {showGenres && (
              <div className="genres-dropdown" onClick={e => e.stopPropagation()}>
                <ul>
                  {GENRES.map((genre, index) => (
                    <li key={index}>
                      <Link to={`/the-loai/${genre}`}>{genre}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </nav>
      </div>
      {/* --- RIGHT: Search + Filter + Mua Gói + User --- */}
      <div className="header-right">
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm phim..."
            value={searchText}
            onChange={async (e) => {
              const value = e.target.value;
              setSearchText(value);
              debouncedSearch(value);
              if (value.trim() === "") {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            className="search-input"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="search-suggestions">
              {suggestions.slice(0, 6).map((movie) => (
                <li key={movie.movieId} className="suggestion-item">
                  <Link to={`/movie/${movie.movieId}`} className="suggestion-link">
                    <img src={movie.thumbnailUrl} alt={movie.title} className="suggestion-img" />
                    <span className="suggestion-title">{movie.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="filter-toggle" onClick={() => setShowFilter(true)} title="Lọc phim">
          <Funnel size={22} color="#fff" style={{ cursor: "pointer", marginLeft: "10px" }} />
        </div>
        <Link to="/buy-package" className="buy-package-btn">
          <FontAwesomeIcon icon={faWallet} style={{ marginRight: "5px" }} />
          Mua Gói
        </Link>
        <div className="user-menu">
          {(MyUser?.my_user?.vipLevel === "GOLD" || MyUser?.my_user?.vipLevel === "SILVER") && (
            <FontAwesomeIcon
              icon={faCrown}
              style={{
                color: MyUser?.my_user?.vipLevel === "GOLD" ? "#FFD43B" : "#C0C0C0",
                height: "20px", width: "40px",
                position: "absolute", bottom: "30px",
              }}
              title={`VIP ${MyUser?.my_user?.vipLevel}`}
            />
          )}
          <img
            src={avatarPreview || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="avatar"
            className="user-avatar"
          />
          <span className="username">
            Xin chào, <strong>{MyUser?.my_user?.userName || "Người dùng"}</strong>
          </span>
          <ul className="dropdown-menu">
            {isAdmin && <li onClick={() => setShowAddMovie(true)} style={{ color: "green" }}>Thêm phim</li>}
            {isAdmin && <li><Link to="/control-panel">Bảng điều khiển</Link></li>}
            {(isUser || isAdmin) && <li><Link to="/profile">Thông tin cá nhân</Link></li>}
            {(isUser || isAdmin)
              ? <li onClick={handleLogout} style={{ color: "red" }}>Đăng xuất</li>
              : <li onClick={handleLogin} style={{ color: "green" }}>Đăng nhập</li>}
          </ul>
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
              <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
                <option value={0}>-- trống --</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
            <div className="select-item">
              <label>Năm:</label>
              <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
                <option value={0}>-- trống --</option>
                {Array.from({ length: 50 }, (_, i) => {
                  const year = 2000 + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>
        </div>
        <div className="filter-actions">
          <button
            className="btn-filter"
            onClick={async () => {
              const result = await MovieService.filterMoviesByYearAndMonth(
                filterYear || 0,
                filterMonth || 0
              );
              if (Array.isArray(result) && result.length > 0) {
                setFilteredMovies(result);
                showToast("Đã lọc phim!", "success");
              } else {
                setFilteredMovies([]);
                showToast("Không tìm thấy phim phù hợp", "error");
              }
            }}
          >
            Lọc
          </button>
        </div>
      </div>
    </div>
  )}
  {/* Add Movie Modal */}
  {showAddMovie && (
    <div className="modaladd-backdrop-custom" onClick={() => setShowAddMovie(false)}>
      <div className="modaladd-content-custom" onClick={e => e.stopPropagation()}>
        <ModelAddMovie
          onSuccess={() => {
            setShowAddMovie(false);
            fetchMovies();
          }}
        />
      </div>
    </div>
  )}
</>
  );
}
export default Header;
