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
      icon: Video,
      color: '#e74c3c'
    },
    {
      value: 'AUDIO_SYNC',
      label: 'Lỗi âm thanh',
      icon: Volume2,
      color: '#f39c12'
    },
    {
      value: 'SUBTITLE_MISSING',
      label: 'Lỗi phụ đề',
      icon: Subtitles,
      color: '#9b59b6'
    },
    {
      value: 'OTHER',
      label: 'Lỗi khác',
      icon: HelpCircle,
      color: '#6b7280'
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

    if (!formData.issueType) {
      toast.error('Vui lòng chọn loại lỗi!');
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData = {
        movieId: movieId ? String(movieId) : null, // Đảm bảo movieId không null
        episodeId: episodeId ? String(episodeId) : null, // episodeId mapping sang seasonId
        episodeNumber: 1, // Mặc định episode 1, có thể customize sau
        issueType: formData.issueType, // VIDEO_PLAYBACK, AUDIO_SYNC, SUBTITLE_MISSING, OTHER
        issueDetail: formData.issueDetail.trim() || 'Người dùng chưa cung cấp mô tả chi tiết',
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
              <h2>Báo lỗi</h2>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
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
                      <IconComponent size={16} />
                    </div>
                    <div className="issue-type-content">
                      <h4>{type.label}</h4>
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
            <label className="section-label">Mô tả chi tiết</label>
            <textarea
              value={formData.issueDetail}
              onChange={(e) => setFormData(prev => ({ ...prev, issueDetail: e.target.value }))}
              placeholder="Mô tả chi tiết lỗi (tùy chọn)"
              className="detail-textarea"
              rows={2}
              maxLength={200}
            />
          </div>

          {/* Buttons */}
          <div className="form-buttons">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Đóng
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || !formData.issueType}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Đang gửi...
                </>
              ) : (
                'Gửi đi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssueModal;
