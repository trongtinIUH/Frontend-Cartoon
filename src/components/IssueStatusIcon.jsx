import React from 'react';
import { FaExclamationTriangle, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

/**
 * Component hiển thị icon và màu sắc dựa trên trạng thái báo lỗi cao nhất
 * Priority: OPEN > IN_PROGRESS > RESOLVED > INVALID
 */
export const IssueStatusIcon = ({ issueStatuses, count = 0 }) => {
  // Nếu không có báo lỗi → hiển thị icon mặc định
  if (!issueStatuses || issueStatuses.length === 0 || count === 0) {
    return <FaExclamationTriangle className="text-secondary" />;
  }

  // Định nghĩa priority của trạng thái (số càng cao = priority cao)
  const statusPriority = {
    'OPEN': 4,
    'IN_PROGRESS': 3,
    'RESOLVED': 2,
    'INVALID': 1
  };

  // Tìm trạng thái có priority cao nhất
  const highestPriorityStatus = issueStatuses.reduce((highest, current) => {
    const currentPriority = statusPriority[current] || 0;
    const highestPriority = statusPriority[highest] || 0;
    return currentPriority > highestPriority ? current : highest;
  }, 'RESOLVED');

  // Mapping icon và màu sắc cho từng trạng thái
  const statusConfig = {
    'OPEN': {
      icon: FaExclamationTriangle,
      className: 'text-danger',
      label: 'Có lỗi mới'
    },
    'IN_PROGRESS': {
      icon: FaClock,
      className: 'text-warning',
      label: 'Đang xử lý'
    },
    'RESOLVED': {
      icon: FaCheckCircle,
      className: 'text-success',
      label: 'Đã giải quyết'
    },
    'INVALID': {
      icon: FaTimesCircle,
      className: 'text-muted',
      label: 'Không hợp lệ'
    }
  };

  const config = statusConfig[highestPriorityStatus] || statusConfig['RESOLVED'];
  const IconComponent = config.icon;

  return (
    <IconComponent 
      className={config.className} 
      title={`${config.label} (${count} báo lỗi)`}
    />
  );
};

/**
 * Component hiển thị nút báo lỗi với icon trạng thái động
 */
export const IssueReportButton = ({ movieId, issueData, onClick, issueCounts }) => {
  const count = issueCounts[movieId] || 0;
  const statuses = issueData[movieId]?.statuses || [];
  
  // Kiểm tra xem có báo lỗi chưa được giải quyết không
  const hasUnresolvedIssues = statuses.some(status => 
    status === 'OPEN' || status === 'IN_PROGRESS'
  );
  
  // Màu nền badge dựa trên trạng thái
  const badgeColor = hasUnresolvedIssues ? 'bg-danger' : 'bg-success';

  return (
    <button 
      className="btn btn-sm btn-outline-warning position-relative"
      onClick={onClick}
    >
      <IssueStatusIcon issueStatuses={statuses} count={count} />
      Báo lỗi
      {count > 0 && (
        <span 
          className={`issue-badge badge rounded-pill ${badgeColor}`}
        >
          {count}
          <span className="visually-hidden">
            {hasUnresolvedIssues ? 'báo lỗi chưa giải quyết' : 'báo lỗi đã giải quyết'}
          </span>
        </span>
      )}
    </button>
  );
};

const IssueStatusIconComponents = { IssueStatusIcon, IssueReportButton };
export default IssueStatusIconComponents;