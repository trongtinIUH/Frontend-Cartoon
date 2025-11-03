/**
 * DeleteRoomButton - Button to delete watch room with confirmation modal
 * @author Senior FE Developer
 * @version 1.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { watchRoomApi } from '../api/watchRoomApi';
import '../css/componentsCSS/DeleteRoomButton.css';

/**
 * DeleteRoomButton Component
 * @param {Object} props
 * @param {string} props.roomId - Room ID to delete
 * @param {number} props.viewerCount - Current number of viewers in room
 * @param {boolean} props.canDelete - Whether user has permission to delete (extra safety check)
 * @param {string} props.currentUserId - Current user ID (for logging)
 * @param {boolean} props.isAdmin - Whether current user is admin (for logging)
 * @param {Function} props.onDeleteSuccess - Callback after successful delete
 */
export const DeleteRoomButton = ({ 
  roomId, 
  viewerCount = 0, 
  canDelete = true, // Default to true for backward compatibility
  currentUserId,
  isAdmin,
  onDeleteSuccess 
}) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  /**
   * Open confirmation modal
   */
  const handleOpenModal = () => {
    setShowModal(true);
    setError('');
    setForceDelete(false);
  };

  /**
   * Close modal
   */
  const handleCloseModal = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setShowModal(false);
    setError('');
    setForceDelete(false);
  };

  /**
   * Handle delete room
   */
  const handleDelete = async () => {
    // Extra safety check - should never happen but just in case
    if (!canDelete) {
      setError('⚠️ Bạn không có quyền xóa phòng này. Chỉ ADMIN hoặc chủ phòng mới có thể xóa.');
      return;
    }

    try {
      setIsDeleting(true);
      setError('');

      // Call API to delete room
      await watchRoomApi.deleteRoom(roomId, forceDelete);

      // Success - Backend has cascade deleted:
      // ✅ All RoomMessages
      // ✅ All WatchRoomMembers
      // ✅ Set room status = DELETED
      
      // Close modal first
      setShowModal(false);

      // Show beautiful toast notification
      toast.success(
        <div>
          <strong>✓ Phòng đã được xóa thành công</strong>
          <div style={{ fontSize: '0.9em', marginTop: '8px', opacity: 0.9 }}>
            • Tất cả tin nhắn đã bị xóa<br/>
            • Tất cả thành viên đã bị xóa<br/>
            • Dữ liệu đã được dọn dẹp hoàn toàn
          </div>
        </div>,
        {
          position: 'top-center',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            background: '#10b981',
            color: 'white',
            borderRadius: '8px',
            padding: '16px',
          },
          progressStyle: {
            background: 'rgba(255, 255, 255, 0.5)',
          },
        }
      );

      // Call callback if provided (this should cleanup player)
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }

      // Give time for cleanup before navigate to rooms list
      setTimeout(() => {
        navigate('/rooms');
      }, 100); // Reduced from 500ms to 100ms for faster UX

    } catch (err) {
      console.error('[DeleteRoomButton] Error deleting room:', err);
      setError(err.message || 'Không thể xóa phòng. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Has viewers warning
   */
  const hasViewers = viewerCount > 1; // > 1 because host is also counted

  return (
    <>
      {/* Delete Button */}
      <button
        onClick={handleOpenModal}
        className="btn-delete-room"
        title="Xóa phòng"
      >
        <i className="fa-solid fa-trash-can"></i>
        <span className="btn-text">Xóa phòng</span>
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="delete-room-modal-overlay" onClick={handleCloseModal}>
          <div 
            className="delete-room-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="delete-room-modal-header">
              <h3>
                <i className="fa-solid fa-triangle-exclamation"></i>
                Xác nhận xóa phòng
              </h3>
              <span 
                onClick={handleCloseModal} 
                className="close-btn"
                disabled={isDeleting}
                aria-label="Đóng"
              >
                <i className="fa-solid fa-xmark"></i>
              </span>
            </div>

            {/* Body */}
            <div className="delete-room-modal-body">
              <p className="warning-text">
                Bạn có chắc chắn muốn xóa phòng này không?
              </p>
              <p className="sub-text">
                Hành động này không thể hoàn tác. <strong>Tất cả dữ liệu sẽ bị xóa vĩnh viễn:</strong>
              </p>
              
              {/* Cascade Delete Warning */}
              <div className="cascade-warning">
                <ul>
                  <li>🗑️ Tất cả tin nhắn trong phòng</li>
                  <li>🗑️ Tất cả thành viên trong phòng</li>
                  <li>🗑️ Lịch sử hoạt động của phòng</li>
                </ul>
              </div>

              {/* Warning if has viewers */}
              {hasViewers && (
                <div className="viewer-warning">
                  <i className="fa-solid fa-users"></i>
                  <span>
                    Phòng đang có <strong>{viewerCount} người xem</strong>. 
                    Họ sẽ bị ngắt kết nối ngay lập tức.
                  </span>
                </div>
              )}

              {/* Force delete checkbox */}
              {hasViewers && (
                <label className="force-checkbox">
                  <input
                    type="checkbox"
                    checked={forceDelete}
                    onChange={(e) => setForceDelete(e.target.checked)}
                    disabled={isDeleting}
                  />
                  <span>Xóa ngay lập tức (bắt buộc nếu có người xem)</span>
                </label>
              )}

              {/* Error message */}
              {error && (
                <div className="error-message">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="delete-room-modal-footer">
              <button
                onClick={handleCloseModal}
                className="btn-cancel"
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="btn-confirm-delete"
                disabled={isDeleting || (hasViewers && !forceDelete) || !canDelete}
                title={!canDelete ? 'Bạn không có quyền xóa phòng này' : ''}
              >
                {isDeleting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-trash-can"></i>
                    Xóa phòng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteRoomButton;
