import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/UpgradeModal.css";

const UpgradeModal = ({ 
  show, 
  onClose, 
  currentMovie, 
  userId,
  getPackageDisplayName 
}) => {
  const navigate = useNavigate();

  if (!show) return null;

  const packageName = getPackageDisplayName(currentMovie?.minVipLevel) || 'VIP';

  const handleUpgrade = () => {
    onClose();
    navigate('/buy-package');
  };

  const handleGoHome = () => {
    onClose();
    navigate(-1);
  };

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  return (
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
         
        <div className="modal-header">
          <div className="vip-crown">👑</div>
          <h2>Nâng cấp VIP để xem tiếp</h2>
          <p>Bạn đã xem hết 15 giây miễn phí</p>
        </div>

        <div className="modal-content">
          <div className="current-movie-info">
            <img 
              src={currentMovie?.poster || currentMovie?.thumbnailUrl} 
              alt={currentMovie?.title}
              className="movie-thumb"
            />
            <div className="movie-details">
              <h3>{currentMovie?.title}</h3>
              <p>Cần gói: <span className="required-package">{packageName}</span></p>
            </div>
          </div>

          <div className="benefits">
            <h4>🎬 Quyền lợi VIP:</h4>
            <ul>
              <li>✅ Xem không giới hạn tất cả phim VIP</li>
              <li>✅ Chất lượng HD cao cấp</li>
              <li>✅ Không quảng cáo</li>
            </ul>
          </div>

          <div className="pricing-highlight">
            <div className="price-tag">
              <span className="amount">Mua ngay để nhận ưu đãi!</span>
            </div>
            <p className="price-desc">Chỉ từ 3,300₫/ngày</p>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-upgrade-primary" onClick={handleUpgrade}>
            🚀 Nâng cấp {packageName} ngay
          </button>
          <button className="btn-upgrade-secondary" onClick={handleGoHome}>
            Quay lại
          </button>
          {!userId && (
            <button className="btn-upgrade-tertiary" onClick={handleLogin}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;