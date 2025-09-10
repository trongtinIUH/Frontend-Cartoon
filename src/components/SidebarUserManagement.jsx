import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import default_avatar from "../image/default_avatar.jpg";
import "../css/componentsCSS/SidebarUserManagement.css"; // import CSS riêng

const SidebarUserManagement = () => {
  const location = useLocation();
  const { MyUser } = useAuth();

  return (
    <div className="sidebar bg-black text-white">
      <div className="sidebar-header text-center py-4">
        <h5 className="m-0">Quản lý tài khoản</h5>
      </div>

      <div className="sidebar-menu mt-3 px-3">
        <ul className="sidebar-nav">
          <li className="nav-item">
            <Link
              to="/favorites"
              className={`nav-link ${
                location.pathname === "/favorites" ? "active" : ""
              }`}
            >
              <i className="fas fa-heart me-2"></i> Yêu thích
            </Link>
          </li>
          <hr />
          <li className="nav-item">
            <Link
              to="/purchase-history"
              className={`nav-link ${
                location.pathname === "/purchase-history" ? "active" : ""
              }`}
            >
              <i className="fas fa-history me-2"></i> Lịch sử thanh toán
            </Link>
          </li>
          <hr />
          <li className="nav-item">
            <Link
              to="/notifications"
              className={`nav-link ${
                location.pathname === "/notifications" ? "active" : ""
              }`}
            >
              <i className="fas fa-clock me-2"></i> Xem tiếp
            </Link>
          </li>
          <hr />
          <li className="nav-item">
            <Link
              to="/profile"
              className={`nav-link ${
                location.pathname === "/profile" ? "active" : ""
              }`}
            >
              <i className="fas fa-user me-2"></i> Tài khoản
            </Link>
          </li>
          <hr />
          <div className="sidebar-footer text-center py-4">
            <img
              src={MyUser?.my_user?.avatarUrl || default_avatar}
              alt="Avatar"
              className="rounded-circle mb-2 avatar"
            />
            <p className="m-0 mt-2">{MyUser?.my_user?.userName}</p>
            <p className="m-0">{MyUser?.my_user?.email}</p>
            {/* <li className="nav-item mt-4">
              <Link
                to="/Logout"
                className={`nav-link text-danger fw-bold ${
                  location.pathname === "/Logout" ? "active" : ""
                }`}
              >
                <i className="fas fa-sign-out-alt me-2"></i> Đăng xuất
              </Link>
            </li> */}
          </div>
        </ul>
      </div>
    </div>
  );
};

export default SidebarUserManagement;
