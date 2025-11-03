/**
 * CreateWatchRoomModal - Modal to create watch together room
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WatchRoomService from '../services/WatchRoomService';
import { toast } from 'react-toastify';
import '../css/CreateWatchRoomModal.css';

const CreateWatchRoomModal = ({ show, onClose, movie, episode, currentVideoUrl }) => {
  const navigate = useNavigate();
  const { MyUser } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (!show) return null;

  const handleCreate = async () => {
    // Ưu tiên dùng currentVideoUrl (URL đang phát), fallback về episode.videoUrl
    const videoUrl = currentVideoUrl || episode?.videoUrl;
    
    if (!videoUrl) {
      toast.error('⚠️ Không tìm thấy video URL. Vui lòng đợi video load xong!');
      return;
    }

    if (!MyUser?.my_user) {
      toast.error('⚠️ Vui lòng đăng nhập để tạo phòng!');
      return;
    }

    // ✅ Kiểm tra gói COMBO_PREMIUM_MEGA_PLUS
    const userPackage = MyUser?.my_user?.packageType;
    if (userPackage !== 'COMBO_PREMIUM_MEGA_PLUS') {
      toast.error('🔒 Chỉ người dùng gói COMBO PREMIUM mới có thể tạo phòng xem chung!');
      return;
    }

    setIsCreating(true);

    try {
      console.log('Creating watch room with video:', videoUrl);

      // Generate room ID
      const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      
      // Prepare room data
      const roomData = {
        roomId: roomId,
        userId: MyUser.my_user.userId,
        movieId: movie?.movieId || movie?.id,
        roomName: roomName.trim() || `Cùng xem ${movie?.title || 'phim này'}`,
        posterUrl: movie?.poster || movie?.thumbnailUrl,
        videoUrl: videoUrl, // Save video URL to database
        isPrivate: isPrivate,
        isAutoStart: false,
        startAt: null,
        createdAt: new Date().toISOString(),
        status: 'ACTIVE'
      };

      console.log('Calling API to create room:', roomData);

      // Call API to create room in database
      await WatchRoomService.createWatchRoom(roomData);

      toast.success('Tạo phòng thành công! Đang chuyển đến phòng...');

      // Close modal
      onClose();

      // Navigate to watch together page with video URL
      const params = new URLSearchParams({
        video: videoUrl,
        host: '1', // Creator is host
      });

      console.log('Navigating to:', `/watch-together/${roomId}?${params.toString()}`);
      
      // Small delay for toast to show
      setTimeout(() => {
        navigate(`/watch-together/${roomId}?${params.toString()}`);
      }, 500);

    } catch (error) {
      console.error('Error creating watch room:', error);
      toast.error('❌ Không thể tạo phòng. Vui lòng thử lại!');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="create-watch-room-modal-overlay" onClick={onClose}>
      <div className="create-watch-room-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🎬 Tạo phòng xem chung</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* ✅ Thông báo gói COMBO PREMIUM */}
          {MyUser?.my_user?.packageType !== 'COMBO_PREMIUM_MEGA_PLUS' && (
            <div className="premium-notice" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>👑</div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                Tính năng dành riêng cho gói COMBO PREMIUM
              </div>
              <div style={{ fontSize: '14px', opacity: '0.9' }}>
                Nâng cấp để tạo phòng xem chung với bạn bè!
              </div>
            </div>
          )}

          <div className="movie-info">
            <img 
              src={movie?.poster || movie?.thumbnailUrl} 
              alt={movie?.title}
              className="movie-poster"
            />
            <div className="movie-details">
              <h4>{movie?.title}</h4>
              <p>Tập {episode?.episodeNumber}: {episode?.episodeTitle || `Tập ${episode?.episodeNumber}`}</p>
            </div>
          </div>

          <div className="form-group">
            <label>Tên phòng (tùy chọn)</label>
            <input
              type="text"
              className="form-input"
              placeholder={`Cùng xem ${movie?.title || 'phim này'} nào!`}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <span>🔒 Phòng riêng tư (cần link mời)</span>
            </label>
          </div>

          <div className="info-box">
            <p>ℹ️ Bạn sẽ là <strong>Host</strong> và có thể điều khiển video</p>
            <p>Chia sẻ link để bạn bè cùng xem!</p>
          </div>
        </div>

        <div className="modal-footer">
          {/* <button className="btn-cancel" onClick={onClose} disabled={isCreating}>
            Hủy
          </button> */}
          <button 
            className="btn-create" 
            onClick={handleCreate}
            disabled={isCreating || MyUser?.my_user?.packageType !== 'COMBO_PREMIUM_MEGA_PLUS'}
            style={{
              opacity: (MyUser?.my_user?.packageType !== 'COMBO_PREMIUM_MEGA_PLUS' && !isCreating) ? 0.5 : 1,
              cursor: (MyUser?.my_user?.packageType !== 'COMBO_PREMIUM_MEGA_PLUS' && !isCreating) ? 'not-allowed' : 'pointer'
            }}
          >
            {isCreating ? (
              <>
                <span className="spinner"></span>
                <span>Đang tạo...</span>
              </>
            ) : MyUser?.my_user?.packageType !== 'COMBO_PREMIUM_MEGA_PLUS' ? (
              '🔒 Cần gói COMBO PREMIUM'
            ) : (
              'Tạo phòng ngay'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWatchRoomModal;
