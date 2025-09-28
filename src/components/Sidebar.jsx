import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/Sidebar.css"; // CSS ở bên dưới
import avatar_default from "../image/default_avatar.jpg";

const Sidebar = () => {
  const { MyUser } = useAuth();
  const admin = MyUser?.my_user || {};
  const location = useLocation();

  // Off-canvas on mobile
  const [open, setOpen] = useState(false);
  const [openStats, setOpenStats] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  // Auto close when route changes (mobile)
  useEffect(() => { setOpen(false); }, [location.pathname]);

  //đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("idToken");
    localStorage.removeItem("my_user");
    localStorage.removeItem("phoneNumber");
    localStorage.removeItem("userAttributes");
    window.location.replace("/");
  };
  return (
    <>
      {/* Toggler chỉ hiện trên màn hình nhỏ */}
      <button
        className="btn btn-primary rounded-circle shadow sidebar-toggler d-lg-none"
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      />

      <aside className={`sidebar-wrapper bg-dark text-white ${open ? "open" : ""}`}>
        <div className="px-3 pt-3">
          <div className="sidebar-tile d-flex align-items-center gap-2 brand-tile">
            <div className="brand-logo rounded-circle d-flex align-items-center justify-content-center">
              <img src={`${process.env.PUBLIC_URL}/image/cartoonToo.png`} alt="" style={{ width: 40, height: 40, borderRadius: "6px" }} />
            </div>
            <div className="min-w-0">
              <div className="fw-bold text-truncate">Admin Cartoon Too</div>
              <small className="text-white-50">Dashboard</small>
            </div>
          </div><hr />
        </div>

        {/* User card
        <div className="px-3 py-3">
          <div className="sidebar-tile d-flex align-items-center gap-3 user-card">
            <img
              src={admin.avatarUrl || avatar_default}
              alt="avatar"
              className="rounded-circle object-cover"
              width="36"
              height="36"
            />
            <div className="name-wrap min-w-0">
              <div className="fw-semibold text-truncate">{admin.userName || "Admin"}</div>
              <small className="text-white-50">Quản trị viên</small>
            </div>
          </div>
        </div> */}
        
        {/* Menu */}
        <div className="sidebar-scroll px-3 pb-4">
          <nav aria-label="Admin navigation">
            <ul className="nav flex-column gap-1">

              <li className="nav-item">
                <NavLink
                  to="/admin-dashboard"
                  className={({ isActive }) =>
                    `nav-link sidebar-link d-flex align-items-center ${isActive ? "active" : ""}`
                  }
                >
                  <i className="fas fa-gauge me-2" /> <span>Dashboard</span>
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/admin-order"
                  className={({ isActive }) =>
                    `nav-link sidebar-link d-flex align-items-center ${isActive ? "active" : ""}`
                  }
                >
                  <i className="fas fa-shopping-cart me-2" /> <span>Quản lý đơn hàng</span>
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/admin-movie"
                  className={({ isActive }) =>
                    `nav-link sidebar-link d-flex align-items-center ${isActive ? "active" : ""}`
                  }
                >
                  <i className="fas fa-box-open me-2" /> <span>Quản lý phim</span>
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/admin-author"
                  className={({ isActive }) =>
                    `nav-link sidebar-link d-flex align-items-center ${isActive ? "active" : ""}`
                  }
                >
                  <i className="fas fa-user-tie me-2" /> <span>Quản lý tác giả/diễn viên</span>
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/admin-member"
                  className={({ isActive }) =>
                    `nav-link sidebar-link d-flex align-items-center ${isActive ? "active" : ""}`
                  }
                >
                  <i className="fas fa-users me-2" /> <span>Quản lý thành viên</span>
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/admin-promotion"
                  className={({ isActive }) =>
                    `nav-link sidebar-link d-flex align-items-center ${isActive ? "active" : ""}`
                  }
                >
                  <i className="fas fa-percent me-2" /> <span>Quản lý khuyến mãi</span>
                </NavLink>
              </li>

              {/* Thống kê (submenu) */}
              <li className="nav-item">
                <NavLink
                  to="/admin-analytics"
                  className={({ isActive }) =>
                    `nav-link sidebar-link d-flex align-items-center ${isActive ? "active" : ""}`
                  }
                >
                  <i className="fas fa-chart-line me-2" /> <span>Thống kê</span>
                </NavLink>
              </li>

              {/* Cài đặt (submenu + lối ra giao diện chính + logout) */}
              <li className="nav-item">
                <button
                  type="button"
                  className="nav-link sidebar-link d-flex align-items-center justify-content-between w-100"
                  aria-expanded={openSettings}
                  aria-controls="submenu-settings"
                  onClick={() => setOpenSettings(v => !v)}
                >
                  <span><i className="fas fa-cog me-2" /> Cài đặt</span>
                  <i className={`fas fa-chevron-right ms-2 transition ${openSettings ? "rotate-90" : ""}`} />
                </button>
                <ul
                  id="submenu-settings"
                  className={`nav flex-column ms-4 mt-1 collapse ${openSettings ? "show" : ""}`}
                >
                  <li className="nav-item">
                    <NavLink
                      to="/profile"
                      className={({ isActive }) =>
                        `nav-link sidebar-sublink d-flex align-items-center ${isActive ? "active" : ""}`
                      }
                    >
                      <i className="fas fa-user me-2" /> Thông tin cá nhân
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink to="/main" className="nav-link sidebar-sublink d-flex align-items-center">
                      <i className="fas fa-tv me-2" /> Giao diện người xem
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink to="/login" className="nav-link sidebar-sublink d-flex align-items-center" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt me-2" /> Đăng xuất
                    </NavLink>
                  </li>
                </ul>
              </li>

            </ul>
          </nav>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
