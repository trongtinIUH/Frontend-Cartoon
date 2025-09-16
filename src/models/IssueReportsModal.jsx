import React, { useState, useEffect } from 'react';
import ReportService from '../services/ReportService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faExclamationTriangle, 
  faClock, 
  faCheckCircle, 
  faTimesCircle, 
  faEye,
  faVideo,
  faVolumeUp,
  faClosedCaptioning,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import '../css/IssueReportsModal.css';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const IssueReportsModal = ({ 
  isOpen, 
  onClose, 
  movieId, 
  movieTitle 
}) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState(null);

  const statusLabels = {
    'OPEN': 'Mới',
    'IN_PROGRESS': 'Đang xử lý',
    'RESOLVED': 'Đã giải quyết',
    'INVALID': 'Không hợp lệ'
  };

  const statusColors = {
    'OPEN': { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' },
    'IN_PROGRESS': { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
    'RESOLVED': { bg: '#d1fae5', text: '#059669', border: '#a7f3d0' },
    'INVALID': { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' }
  };

  const typeLabels = {
    'VIDEO_PLAYBACK': 'Lỗi video',
    'VIDEO': 'Lỗi video',  // Backend format
    'AUDIO_SYNC': 'Lỗi âm thanh',
    'AUDIO': 'Lỗi âm thanh',  // Backend format
    'SUBTITLE_MISSING': 'Lỗi phụ đề',
    'SUBTITLE': 'Lỗi phụ đề',  // Backend format
    'OTHER': 'Khác'
  };

  // Helper to get issue ID (Backend uses issueId, Frontend might use reportId)
  const getIssueId = (issue) => issue.issueId || issue.reportId;

  const typeIcons = {
    'VIDEO_PLAYBACK': faVideo,
    'VIDEO': faVideo,  // Backend format
    'AUDIO_SYNC': faVolumeUp,
    'AUDIO': faVolumeUp,  // Backend format
    'SUBTITLE_MISSING': faClosedCaptioning,
    'SUBTITLE': faClosedCaptioning,  // Backend format
    'OTHER': faQuestionCircle
  };

  useEffect(() => {
    if (isOpen && movieId) {
      fetchIssues();
    }
  }, [isOpen, movieId]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await ReportService.getPlaybackIssues(movieId);
      setIssues(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Không thể tải danh sách báo lỗi');
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (issueId, newStatus, issue) => {
    try {
      // Enhanced parameter logging
      const seasonId = issue.seasonId || issue.episodeId;
      const updateParams = {
        issueId: issueId,
        newStatus: newStatus,
        movieId: movieId,
        seasonId: seasonId,
        episodeNumber: issue.episodeNumber || 1
      };
      
      // Validate required parameters
      if (!issueId) {
        throw new Error('Missing issueId');
      }
      if (!movieId) {
        throw new Error('Missing movieId');
      }
      if (!newStatus) {
        throw new Error('Missing newStatus');
      }
      
      const result = await ReportService.updateIssueStatus(
        issueId, 
        newStatus, 
        movieId, 
        seasonId, // Use seasonId if available, otherwise episodeId
        issue.episodeNumber || 1
      );
      
      toast.success('Cập nhật trạng thái thành công!');
      fetchIssues(); // Reload danh sách
    } catch (error) {
      console.error('Error updating status:', error);
      
      // Enhanced error logging
      if (error.response) {
        // Specific error handling for 500
        if (error.response.status === 500) {
          console.error('500 Internal Server Error detected');
        }
        
        // Specific error handling for 403 (Admin permission)
        if (error.response.status === 403) {
          toast.error('Bạn không có quyền admin để thực hiện hành động này');
        }
        
        // Specific error handling for 400/404 (Path mismatch)
        if (error.response.status === 400 || error.response.status === 404) {
          toast.error('Lỗi đường dẫn API. Vui lòng kiểm tra Backend configuration.');
        }
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi cập nhật trạng thái';
      toast.error(errorMessage);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const groupIssuesByEpisode = (issues) => {
    const grouped = {};
    issues.forEach(issue => {
      const episodeKey = issue.episodeId || 'general';
      if (!grouped[episodeKey]) {
        grouped[episodeKey] = {
          episodeId: issue.episodeId,
          episodeTitle: issue.episodeTitle || 'Tổng quát',
          issues: []
        };
      }
      grouped[episodeKey].issues.push(issue);
    });
    return Object.values(grouped);
  };

  if (!isOpen) return null;

  const groupedIssues = groupIssuesByEpisode(issues);

  return (
    <div className="issues-modal-overlay" onClick={onClose}>
      <div className="issues-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="issues-modal-header">
          <div className="header-content">
            <div className="header-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} size="lg" style={{color: "#dc3545"}} />
            </div>
            <div className="header-text">
              <h2>Báo lỗi phim: {movieTitle}</h2>
              <p>{issues.length} báo lỗi</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="close-button" onClick={onClose}>
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="issues-modal-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Đang tải báo lỗi...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faCheckCircle} size="3x" style={{color: "#10b981"}} />
              <h3>Không có báo lỗi nào</h3>
              <p>Phim này chưa có báo lỗi từ người dùng.</p>
            </div>
          ) : (
            <div className="issues-list">
              {groupedIssues.map((group) => (
                <div key={group.episodeId || 'general'} className="episode-group">
                  <div className="episode-header">
                    <h3>{group.episodeTitle}</h3>
                    <span className="issue-count">{group.issues.length} báo lỗi</span>
                  </div>

                  <div className="issues-grid">
                    {group.issues.map((issue) => {
                      const typeIcon = typeIcons[issue.issueType || issue.type];
                      const statusStyle = statusColors[issue.status];
                      const issueId = getIssueId(issue);
                      const isExpanded = expandedIssue === issueId;

                      return (
                        <div key={issueId} className="issue-card">
                          {/* Issue Header */}
                          <div className="issue-header">
                            <div className="issue-type">
                              <FontAwesomeIcon icon={typeIcon} size="lg" />
                              <span>{typeLabels[issue.issueType || issue.type]}</span>
                            </div>
                            <div 
                              className="issue-status"
                              style={{
                                background: statusStyle.bg,
                                color: statusStyle.text,
                                border: `1px solid ${statusStyle.border}`
                              }}
                            >
                              {statusLabels[issue.status]}
                            </div>
                          </div>

                          {/* Issue Meta */}
                          <div className="issue-meta">
                            <div className="meta-item">
                              <strong>Thời điểm:</strong> {formatTime(issue.timeStamp)}
                            </div>
                            <div className="meta-item">
                              <strong>Người báo:</strong> {issue.userName || 'Người dùng'}
                            </div>
                            <div className="meta-item">
                              <strong>Thời gian:</strong> {dayjs(issue.createdAt).fromNow()}
                            </div>
                          </div>

                          {/* Issue Detail */}
                          <div className="issue-detail">
                            <p>{issue.issueDetail || issue.detail}</p>
                          </div>

                          {/* Expanded Info */}
                          {isExpanded && (
                            <div className="issue-expanded">
                              <div className="expanded-info">
                                <div className="info-row">
                                  <strong>ID báo lỗi:</strong> #{issueId}
                                </div>
                                <div className="info-row">
                                  <strong>Tạo lúc:</strong> {dayjs(issue.createdAt).format('DD/MM/YYYY HH:mm')}
                                </div>
                                <div className="info-row">
                                  <strong>Cập nhật lúc:</strong> {dayjs(issue.updatedAt).format('DD/MM/YYYY HH:mm')}
                                </div>
                                {issue.adminNote && (
                                  <div className="info-row">
                                    <strong>Ghi chú admin:</strong> {issue.adminNote}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="issue-actions">
                            <button
                              className="action-button expand-button"
                              onClick={() => setExpandedIssue(isExpanded ? null : issueId)}
                            >
                              <FontAwesomeIcon icon={faEye} size="sm" />
                              {isExpanded ? 'Thu gọn' : 'Chi tiết'}
                            </button>

                            {issue.status === 'OPEN' && (
                              <button
                                className="action-button progress-button"
                                onClick={() => handleStatusChange(issueId, 'IN_PROGRESS', issue)}
                              >
                                <FontAwesomeIcon icon={faClock} size="sm" />
                                Xử lý
                              </button>
                            )}

                            {(issue.status === 'OPEN' || issue.status === 'IN_PROGRESS') && (
                              <button
                                className="action-button resolve-button"
                                onClick={() => handleStatusChange(issueId, 'RESOLVED', issue)}
                              >
                                <FontAwesomeIcon icon={faCheckCircle} size="sm" />
                                Giải quyết
                              </button>
                            )}

                            {issue.status !== 'INVALID' && (
                              <button
                                className="action-button invalid-button"
                                onClick={() => handleStatusChange(issueId, 'INVALID', issue)}
                              >
                                <FontAwesomeIcon icon={faTimesCircle} size="sm" />
                                Không hợp lệ
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="issues-modal-footer">
          <button className="footer-button" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueReportsModal;
