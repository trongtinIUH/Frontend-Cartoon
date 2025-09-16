import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReportService from '../services/ReportService';
import { toast } from 'react-toastify';
import { X, AlertTriangle, Video, Volume2, Subtitles, HelpCircle } from 'lucide-react';
import '../css/ReportIssueModal.css';

const ReportIssueModal = ({ 
  isOpen, 
  onClose, 
  movieId, 
  movieTitle, 
  episodeId, 
  episodeTitle,
  currentTime = 0 
}) => {
  const { MyUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    issueType: '',
    issueDetail: '',
    timeStamp: Math.floor(currentTime)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issueTypes = [
    {
      value: 'VIDEO_PLAYBACK',
      label: 'Lỗi video',
      description: 'Video không phát, bị lag, giật, tối hoặc không có hình ảnh',
      icon: Video,
      color: '#e74c3c'
    },
    {
      value: 'AUDIO_SYNC',
      label: 'Lỗi âm thanh',
      description: 'Không có tiếng, âm thanh và hình ảnh không đồng bộ',
      icon: Volume2,
      color: '#f39c12'
    },
    {
      value: 'SUBTITLE_MISSING',
      label: 'Lỗi phụ đề',
      description: 'Phụ đề bị thiếu, sai hoặc không hiển thị',
      icon: Subtitles,
      color: '#9b59b6'
    },
    {
      value: 'OTHER',
      label: 'Lỗi khác',
      description: 'Các vấn đề khác không thuộc danh mục trên',
      icon: HelpCircle,
      color: '#34495e'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!MyUser) {
      toast.error('Vui lòng đăng nhập để báo lỗi!');
      onClose();
      navigate('/login');
      return;
    }

    if (!formData.issueType || !formData.issueDetail.trim()) {
      toast.error('Vui lòng chọn loại lỗi và mô tả chi tiết!');
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData = {
        movieId: movieId ? String(movieId) : null, // Đảm bảo movieId không null
        episodeId: episodeId ? String(episodeId) : null, // episodeId mapping sang seasonId
        episodeNumber: 1, // Mặc định episode 1, có thể customize sau
        issueType: formData.issueType, // VIDEO_PLAYBACK, AUDIO_SYNC, SUBTITLE_MISSING, OTHER
        issueDetail: formData.issueDetail.trim(),
        timeStamp: formData.timeStamp
      };

      // Validate dữ liệu trước khi gửi
      if (!reportData.movieId) {
        toast.error('Không tìm thấy thông tin phim!');
        return;
      }

      await ReportService.reportPlaybackIssue(reportData);
      
      toast.success('Đã gửi báo lỗi thành công! Cảm ơn bạn đã góp ý.', {
        position: "top-right",
        autoClose: 3000,
      });
      
      // Reset form và đóng modal
      setFormData({
        issueType: '',
        issueDetail: '',
        timeStamp: Math.floor(currentTime)
      });
      onClose();
      
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Có lỗi xảy ra khi gửi báo lỗi. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="report-modal-header">
          <div className="header-content">
            <div className="header-icon">
              <AlertTriangle size={24} color="#e74c3c" />
            </div>
            <div className="header-text">
              <h2>Báo lỗi phim</h2>
              <p>Giúp chúng tôi cải thiện chất lượng phục vụ</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Movie Info */}
        <div className="movie-info-section">
          <div className="movie-info">
            <h3>{movieTitle}</h3>
            {episodeTitle && <span className="episode-info">{episodeTitle}</span>}
            <span className="time-info">Thời điểm: {formatTime(formData.timeStamp)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="report-form">
          {/* Issue Type Selection */}
          <div className="form-section">
            <label className="section-label">Loại lỗi *</label>
            <div className="issue-types">
              {issueTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <div
                    key={type.value}
                    className={`issue-type-card ${formData.issueType === type.value ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, issueType: type.value }))}
                  >
                    <div className="issue-type-icon" style={{ color: type.color }}>
                      <IconComponent size={20} />
                    </div>
                    <div className="issue-type-content">
                      <h4>{type.label}</h4>
                      <p>{type.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Stamp */}
          <div className="form-section">
            <label className="section-label">Thời điểm xảy ra lỗi</label>
            <div className="time-input-container">
              <input
                type="number"
                min="0"
                step="1"
                value={formData.timeStamp}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  timeStamp: parseInt(e.target.value) || 0 
                }))}
                className="time-input"
                placeholder="Giây"
              />
              <span className="time-display">{formatTime(formData.timeStamp)}</span>
            </div>
          </div>

          {/* Issue Detail */}
          <div className="form-section">
            <label className="section-label">Mô tả chi tiết *</label>
            <textarea
              value={formData.issueDetail}
              onChange={(e) => setFormData(prev => ({ ...prev, issueDetail: e.target.value }))}
              placeholder="Vui lòng mô tả chi tiết về lỗi bạn gặp phải. Ví dụ: Video bị lag từ phút 15:30, âm thanh chậm hơn hình ảnh 2 giây..."
              className="detail-textarea"
              rows={4}
              maxLength={500}
            />
            <div className="char-count">
              {formData.issueDetail.length}/500 ký tự
            </div>
          </div>

          {/* Buttons */}
          <div className="form-buttons">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || !formData.issueType || !formData.issueDetail.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Đang gửi...
                </>
              ) : (
                'Gửi báo lỗi'
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="report-modal-footer">
          <p>💡 Báo lỗi của bạn sẽ được xem xét và xử lý trong thời gian sớm nhất</p>
        </div>
      </div>
    </div>
  );
};

export default ReportIssueModal;
