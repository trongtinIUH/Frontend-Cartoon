import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaArrowUp,
  FaEnvelope,
  FaHeart,
  FaPlay,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/Footer.css";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer-modern">
      <div className="container py-5">
        {/* Main Content */}
        <div className="row g-5">
          
          {/* Brand Section */}
          <div className="col-lg-4">
            <div className="brand-section">
              <h2 className="brand-title">
                <FaPlay className="brand-icon" />
                CartoonToo
              </h2>
              <p className="brand-description">
                Nền tảng streaming hoạt hình hàng đầu với hàng nghìn bộ phim chất lượng cao từ khắp thế giới.
              </p>
              
              {/* Social Links */}
              <div className="social-links">
                <a href="#" className="social-link facebook">
                  <FaFacebookF />
                </a>
                <a href="#" className="social-link instagram">
                  <FaInstagram />
                </a>
                <a href="#" className="social-link twitter">
                  <FaTwitter />
                </a>
                <a href="#" className="social-link youtube">
                  <FaYoutube />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-4">
            <div className="footer-column">
              <h5 className="column-title">Thể Loại</h5>
              <ul className="footer-links">
                <li><a href="/phim-han-quoc">Phim Hàn Quốc</a></li>
                <li><a href="/phim-trung-quoc">Phim Trung Quốc</a></li>
                <li><a href="/phim-nhat-ban">Phim Nhật Bản</a></li>
                <li><a href="/phim-my">Phim Mỹ</a></li>
                <li><a href="/phim-thai-lan">Phim Thái Lan</a></li>
              </ul>
            </div>
          </div>

          <div className="col-lg-2 col-md-4">
            <div className="footer-column">
              <h5 className="column-title">Tính Năng</h5>
              <ul className="footer-links">
                <li><a href="#">Xem Offline</a></li>
                <li><a href="#">Chất Lượng 4K</a></li>
                <li><a href="#">Không Quảng Cáo</a></li>
                <li><a href="#">Đa Thiết Bị</a></li>
                <li><a href="#">Phụ Đề Đa Ngôn Ngữ</a></li>
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="col-lg-4 col-md-4">
            <div className="footer-column">
              <h5 className="column-title">Cập Nhật Mới Nhất</h5>
              <p className="newsletter-text">
                Đăng ký để nhận thông báo về phim mới và ưu đãi đặc biệt
              </p>
              
              <div className="newsletter-form">
                <div className="input-wrapper">
                  <input 
                    type="email" 
                    placeholder="Nhập email của bạn..."
                    className="newsletter-input"
                  />
                  <button className="newsletter-btn">
                    <FaEnvelope />
                  </button>
                </div>
              </div>

              <div className="contact-info">
                <p>
                  <FaEnvelope className="contact-icon" />
                  <a href="mailto:trantin1973@gmail.com">cartoonto@gmail.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer-section">
          <div className="disclaimer-card">
            <h6 className="disclaimer-title">⚠️ Miễn Trừ Trách Nhiệm</h6>
            <p className="disclaimer-text">
              Trang web này chỉ cung cấp nội dung giải trí và 
              <strong> không chịu trách nhiệm </strong>
              về các nội dung quảng cáo hay liên kết bên thứ ba.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bottom-bar">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="copyright">
                © 2025 CartoonToo. Made with <FaHeart className="heart-icon" /> by 
                <a href="https://www.linkedin.com/in/tín-trần-trọng-b05549367/" className="author-link">
                  Trần Trọng Tín & Trần Tấn Đạt
                </a>
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <button onClick={scrollToTop} className="scroll-top-btn">
                <FaArrowUp />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;