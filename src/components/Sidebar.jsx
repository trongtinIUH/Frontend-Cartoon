import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import '../css/Sidebar.css'; // Import the CSS file for styling

const Sidebar = () => {
  const location = useLocation();
  const [openStats, setOpenStats] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);
  return (
    <div className="sidebar bg-dark text-white vh-100 position-fixed" style={{ width: '250px' }}>
      <div className="sidebar-header text-center py-4 border-bottom">
        <h5 className="m-0">Admin Cartoon Too</h5>
      </div>
      <div className="text-center mt-3">
        <img
          src="https://adminlte.io/themes/v3/dist/img/user2-160x160.jpg"
          className="rounded-circle"
          width="80"
          alt="User"
        />
        <p className="mt-2">DAT TRAN</p>
      </div> <hr />
      <div className="sidebar-menu mt-3 px-3">
        {/* <div className="form-group mb-3">
          <input className="form-control form-control-sm" placeholder="Search" />
        </div> */}

        <ul className="nav flex-column">
          <li className="nav-item">
            <Link
              to="/admin-dashboard"
              className={`nav-link text-white hover-bg ${location.pathname === '/admin-dashboard' ? 'active' : ''}`}
            >
              <i className="fas fa-tachometer-alt me-2"></i> Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="#"
              className={`nav-link text-white hover-bg ${location.pathname === '/admin-order' ? 'active' : ''}`}
            >
              <i className="fas fa-shopping-cart me-2"></i> Quản lý đơn hàng
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/admin-movie"
              className={`nav-link text-white hover-bg ${location.pathname === '/admin-movie' ? 'active' : ''}`}
            >
              <i className="fas fa-box-open me-2"></i> Quản lý phim
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="#"
              className={`nav-link text-white hover-bg ${location.pathname === '/admin-episode' ? 'active' : ''}`}
            >
              <i className="fas fa-th me-2"></i> Quản lý tập phim
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="#"
              className={`nav-link text-white hover-bg ${location.pathname === '/admin-member' ? 'active' : ''}`}
            >
              <i className="fas fa-users me-2"></i> Quản lý thành viên
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="#"
              className={`nav-link text-white hover-bg ${location.pathname === '/admin-promotion' ? 'active' : ''}`}
            >
              <i className="fas fa-percent me-2"></i> Quản lý khuyến mãi
            </Link>
          </li>
          <li className="nav-item">
            <div
              className="nav-link text-white hover-bg d-flex justify-content-between align-items-center"
              style={{ cursor: 'pointer' }}
              onClick={() => setOpenStats(!openStats)}
            >
              <span>
                <i className="fas fa-chart-line me-2"></i> Thống kê
              </span>
              <i className={`fas fa-chevron-${openStats ? 'down' : 'right'}`}></i>
            </div>
            {openStats && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <Link 
                  to="#" 
                  className={`nav-link text-white hover-bg ${location.pathname === '/admin-revenue' ? 'active' : ''}`}>
                    <i className="fa-solid fa-dollar-sign me-2"></i> Doanh thu
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li className="nav-item">
            <div
              className="nav-link text-white hover-bg d-flex justify-content-between align-items-center"
              style={{ cursor: 'pointer' }}
              onClick={() => setSettingOpen(!settingOpen)}
            >
              <div>
                <i className="fas fa-cog me-2"></i> Cài đặt
              </div>
              <i className={`fas fa-chevron-${settingOpen ? 'down' : 'right'}`}></i>
            </div>

            {/* Dropdown con */}
            {settingOpen && (
              <ul className="nav flex-column ms-3 mt-1">
                <li className="nav-item">
                  <Link to="/profile" className="nav-link text-white hover-bg">
                    <i className="fas fa-user me-2"></i> Thông tin cá nhân
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/logout" className="nav-link text-white hover-bg">
                    <i className="fas fa-sign-out-alt me-2"></i> Đăng xuất
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
