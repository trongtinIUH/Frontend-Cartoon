import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/Header.css";
import showToast from "../utils/AppUtils";
import ModelAddMovie from "../models/ModelAddMovie";
import MovieService from "../services/MovieService";
import { debounce } from "lodash";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Funnel } from "lucide-react"; // Assuming you have lucide-react installed for icons

const Header = ({ fetchMovies, setFilteredMovies }) => {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterMonth, setFilterMonth] = useState(0); // 0 nghĩa là không chọn
  const [filterYear, setFilterYear] = useState(0);  // 0 nghĩa là không chọn  

  const navigate = useNavigate();
  const { MyUser } = useAuth();
  const [showAddMovie, setShowAddMovie] = useState(false);
  const isAdmin = MyUser?.my_user?.role === "ADMIN";
  const isUser = MyUser?.my_user?.role === "USER";
  const [showGenres, setShowGenres] = useState(false);

  const GENRES = ["Âm nhạc", "Anime", "Bí ẩn", "Bi kịch", "CN Animation", "[CNA] Hài hước", "[CNA] Ngôn tình", "Đam mỹ", "Demon", "Dị giới", "Đời thường", "Drama", "Ecchi", "Gia Đình", "Giả tưởng", "Hài hước", "Hành động", "Harem", "Hệ Thống", "HH2D", "HH3D", "Học đường", "Huyền ảo", "Khoa huyễn", "Kiếm hiệp", "Kinh dị", "Lịch sử", "Live Action", "Luyện Cấp", "Ma cà rồng", "Mecha", "Ngôn tình", "OVA", "Phiêu lưu", "Psychological", "Quân đội", "Samurai", "Sắp chiếu", "Seinen", "Shoujo", "Shoujo AI", "Shounen", "Shounen AI", "Siêu năng lực", "Siêu nhiên", "Thám tử", "Thể thao", "Thriller", "Tiên hiệp", "Tình cảm", "Tokusatsu", "Trò chơi", "Trùng sinh", "Tu Tiên", "Viễn tưởng", "Võ hiệp", "Võ thuật", "Xuyên không"];

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



  return (
    <>
      <header className="main-header">
        <div className="header-left">
          <Link to="/main" onClick={reloadMainPage}>
            <img
              src={process.env.PUBLIC_URL + "/image/cartoonToo.png"}
              alt="Logo"
              className="logo"
              style={{ borderRadius: "20px", height: "50px", width: "80px" }}
            />
          </Link>
          <nav className="nav-links">
            <Link to="/main" onClick={reloadMainPage}>Trang chủ</Link>
            <Link to="/main" onClick={reloadMainPage}>Anime</Link>
            <Link to="/main" onClick={reloadMainPage}>Top</Link>
            <div
              className="genre-menu-wrapper"
              onMouseEnter={() => setShowGenres(true)}
              onMouseLeave={() => setShowGenres(false)}
            >
              <span className="nav-links" style={{ fontWeight: "500" }}>Thể loại</span>
              {showGenres && (
                <div className="genres-dropdown">
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
            <Link to="https://trongtiniuh.github.io/deploy-my-cv/">Liên hệ</Link>
          </nav>

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

        </div>
        <div className="header-right">
          <div className="user-menu">
            <img
              src="https://i.pinimg.com/736x/6a/bc/f8/6abcf84ac150893bfaad32730c3a99a8.jpg"
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
      </header>

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

                  console.log("Kết quả lọc:", result);
                  if (Array.isArray(result) && result.length > 0) {
                    setFilteredMovies(result);
                    showToast("Đã lọc phim!", "success");
                  } else {
                    setFilteredMovies([]); // cập nhật về mảng rỗng để hiển thị thông báo
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
};

export default Header;
