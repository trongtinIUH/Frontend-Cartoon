/**
 * InviteCodeModal - Modal for entering invite code for private rooms
 * @author Senior FE Developer
 */

import React, { useState } from 'react';
import '../css/InviteCodeModal.css';

export const InviteCodeModal = ({ isOpen, onSubmit, onCancel, roomName }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setError('Vui lòng nhập mã mời');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSubmit(inviteCode.trim());
    } catch (err) {
      setError(err.message || 'Mã mời không đúng');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setInviteCode('');
      setError('');
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="invite-code-modal-overlay" onClick={handleClose}>
      <div className="invite-code-modal" onClick={(e) => e.stopPropagation()}>
        <div className="invite-code-modal-header">
          <h3>🔒 Phòng Riêng Tư</h3>
          <span 
            className="invite-code-modal-close"
            onClick={handleClose}
            disabled={isLoading}
          >
            <i className="fas fa-times"></i>
          </span>
        </div>

        <div className="invite-code-modal-body">
          <p className="invite-code-modal-description">
            Phòng <strong>{roomName || 'này'}</strong> yêu cầu mã mời để tham gia.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="invite-code-input-group">
              <label htmlFor="inviteCode">Mã mời</label>
              <input
                id="inviteCode"
                type="text"
                className="invite-code-input"
                placeholder="Nhập mã mời..."
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
                autoFocus
              />
              {error && <div className="invite-code-error">{error}</div>}
            </div>

            <div className="invite-code-modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleClose}
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-small"></span>
                    Đang kiểm tra...
                  </>
                ) : (
                  'Tham gia'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteCodeModal;
