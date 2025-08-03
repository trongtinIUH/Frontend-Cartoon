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

      <style jsx>{`
        .footer-modern {
          background: linear-gradient(135deg, #0f1419 0%, #1a202c 50%, #2d3748 100%);
          color: #e2e8f0;
          position: relative;
          overflow: hidden;
        }

        .footer-modern::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #4a5568, transparent);
        }

        /* Brand Section */
        .brand-section {
          padding-right: 2rem;
        }

        .brand-title {
          font-size: 2.2rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .brand-icon {
          color: #3b82f6;
          font-size: 2rem;
        }

        .brand-description {
          color: #a0aec0;
          line-height: 1.7;
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }

        /* Social Links */
        .social-links {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
          font-size: 1.1rem;
        }

        .social-link.facebook { background: linear-gradient(135deg, #3b5998, #4267B2); }
        .social-link.instagram { background: linear-gradient(135deg, #E4405F, #C13584, #833AB4); }
        .social-link.twitter { background: linear-gradient(135deg, #1DA1F2, #0d8bd9); }
        .social-link.youtube { background: linear-gradient(135deg, #FF0000, #CC0000); }

        .social-link:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }

        /* Footer Columns */
        .footer-column {
          height: 100%;
        }

        .column-title {
          color: #ffffff;
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
          position: relative;
          padding-bottom: 0.5rem;
        }

        .column-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 30px;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          border-radius: 1px;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 0.8rem;
        }

        .footer-links a {
          color: #a0aec0;
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          position: relative;
          padding-left: 0;
        }

        .footer-links a:hover {
          color: #3b82f6;
          padding-left: 8px;
        }

        /* Newsletter */
        .newsletter-text {
          color: #a0aec0;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .newsletter-form {
          margin-bottom: 2rem;
        }

        .input-wrapper {
          display: flex;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .newsletter-input {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: rgba(255,255,255,0.1);
          color: #ffffff;
          font-size: 0.9rem;
          backdrop-filter: blur(10px);
        }

        .newsletter-input::placeholder {
          color: #a0aec0;
        }

        .newsletter-input:focus {
          outline: none;
          background: rgba(255,255,255,0.15);
        }

        .newsletter-btn {
          padding: 12px 20px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: none;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .newsletter-btn:hover {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
          transform: scale(1.05);
        }

        /* Contact Info */
        .contact-info p {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          font-size: 0.9rem;
        }

        .contact-info a {
          color: #3b82f6;
          text-decoration: none;
        }

        .contact-icon {
          color: #3b82f6;
        }

        /* Disclaimer */
        .disclaimer-section {
          margin: 3rem 0 2rem;
        }

        .disclaimer-card {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
        }

        .disclaimer-title {
          color: #f59e0b;
          font-weight: 600;
          margin-bottom: 0.8rem;
        }

        .disclaimer-text {
          color: #d1d5db;
          font-size: 0.85rem;
          margin: 0;
          line-height: 1.6;
        }

        /* Bottom Bar */
        .bottom-bar {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 2rem;
        }

        .copyright {
          color: #9ca3af;
          font-size: 0.85rem;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .heart-icon {
          color: #ef4444;
          animation: heartbeat 2s infinite;
        }

        .author-link {
          color: #3b82f6;
          text-decoration: none;
          margin-left: 0.3rem;
        }

        .scroll-top-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .scroll-top-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
        }

        @keyframes heartbeat {
          0%, 50%, 100% { transform: scale(1); }
          25%, 75% { transform: scale(1.1); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .brand-section {
            padding-right: 0;
            margin-bottom: 2rem;
          }
          
          .social-links {
            justify-content: center;
          }
          
          .newsletter-form {
            margin-bottom: 1.5rem;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;