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
      <div className="upgrade-modal-compact" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {/* Header with movie info */}
        <div className="modal-header-compact">
          <div className="movie-poster-small">
            <img 
              src={currentMovie?.poster || currentMovie?.thumbnailUrl} 
              alt={currentMovie?.title}
            />
            <div className="vip-badge-small">{packageName}</div>
          </div>
          <div className="movie-info-compact">
            <h3>{currentMovie?.title}</h3>
            <p>⏰ Hết thời gian xem thử</p>
          </div>
        </div>

        {/* Benefits - Simple list */}
        <div className="benefits-compact">
          <div className="benefit-row">
            <span>🎬</span> Xem không giới hạn
          </div>
          <div className="benefit-row">
            <span>📱</span> Chất lượng HD+
          </div>
          <div className="benefit-row">
            <span>🚫</span> Không quảng cáo
          </div>
        </div>

        {/* Price */}
        <div className="price-compact">
          <span className="price-text">Chỉ từ <strong>3,300₫/ngày</strong></span>
        </div>

        {/* Actions */}
        <div className="actions-compact">
          <button className="btn-upgrade-main" onClick={handleUpgrade}>
            💎 Nâng cấp {packageName}
          </button>
          <div className="secondary-actions-compact">
            <button className="btn-back" onClick={handleGoHome}>Quay lại</button>
            {!userId && (
              <button className="btn-login" onClick={handleLogin}>Đăng nhập</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;