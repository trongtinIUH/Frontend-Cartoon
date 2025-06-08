import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/Header.css";

const Header = () => {
  const navigate = useNavigate();
  const { MyUser } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("idToken");
    navigate("/");
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <Link to="/">
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
        <img
          src="https://i.pinimg.com/736x/6a/bc/f8/6abcf84ac150893bfaad32730c3a99a8.jpg"
          alt="avatar"
          className="user-avatar"
        />
        <span className="username">
          Xin chào, <strong>{MyUser.my_user.userName || "Người dùng"}</strong>
        </span>
        <button className="logout-button" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
};

export default Header;
