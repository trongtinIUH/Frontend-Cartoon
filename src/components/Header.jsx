import React, {useState, useEffect} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/Header.css";
import showToast from "../utils/AppUtils";
import ModelAddMovie from "../pages/ModelAddMovie"; 


const Header = ({ fetchMovies }) => {
  const navigate = useNavigate();
  const { MyUser } = useAuth();
  const [showAddMovie, setShowAddMovie] = useState(false);
  // Kiểm tra quyền admin
  const isAdmin = MyUser?.my_user?.role === "ADMIN";



  const handleLogout = () => {
    localStorage.removeItem("idToken");
    navigate("/");
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <Link to="/main">
         <img
            src={process.env.PUBLIC_URL + "/image/cartoonToo.png"}
            alt="Logo"
            className="logo"
           style={{borderRadius: "20px", height: "50px", width: "80px"}}
          />
        </Link>
        <nav className="nav-links">
          <Link to="/">Trang chủ</Link>
          <Link to="/anime">Anime</Link>
          <Link to="/top">Top</Link>
          <Link to="/the-loai">Thể loại</Link>
          <Link to="/lien-he">Liên hệ</Link>
        </nav>
      </div>
      <div className="header-right">
        <div className="user-menu">
        <img
          src="https://i.pinimg.com/736x/6a/bc/f8/6abcf84ac150893bfaad32730c3a99a8.jpg"
          alt="avatar"
          className="user-avatar"
        />
        <span className="username">
          Xin chào, <strong>{MyUser.my_user.userName || "Người dùng"}</strong>
        </span>
        
          <ul className="dropdown-menu">
             {isAdmin && (
             <li onClick={() => setShowAddMovie(true)} style={{color:"green"}}>Thêm phim</li>
              )}
               {isAdmin && (
             <li><Link to="/control-panel">Bảng điều khiển</Link></li>
              )}
             <li><Link to="/profile">Thông tin cá nhân</Link></li>
            <li onClick={handleLogout} style={{color:"red"}}>Đăng xuất</li>
          </ul>
        </div>
      </div>
  {/* Hiển thị modal khi showAddMovie = true */}
    {showAddMovie && (
      <div className="modal-backdrop-custom"
         onClick={() => setShowAddMovie(false)}>
          <div className="modal-content-custom"
            onClick={e => e.stopPropagation()}>
     
          <ModelAddMovie
            onSuccess={() => {
              setShowAddMovie(false);
              fetchMovies(); // GỌI LẠI API sau khi thêm thành công
            }}
          />
        </div>
      </div>
    )}
    </header>
  );
};

export default Header;
