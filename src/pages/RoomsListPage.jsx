import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/RoomsListPage.css";
import avatar_default from "../image/default_avatar.jpg";
import WatchRoomService from "../services/WatchRoomService";
import InviteCodeModal from "../components/InviteCodeModal";
import { faL } from "@fortawesome/free-solid-svg-icons";

// Đếm ngược từ startAt (ISO) -> "HH:MM:SS"
const fmtCountdown = (startAt) => {
  if (!startAt) return null;
  const left = Math.max(0, Math.floor((Date.parse(startAt) - Date.now()) / 1000));
  const hh = String(Math.floor(left / 3600)).padStart(2, "0");
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

// Suy luận trạng thái từ startAt
const deriveStatus = (startAt) => {
  if (!startAt) return "ACTIVE";
  const isFuture = Date.parse(startAt) > Date.now();
  return isFuture ? "SCHEDULED" : "ACTIVE";
};

export default function RoomsListPage() {
  const navigate = useNavigate();
  const { MyUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, forceTick] = useState(0);
  
  // Check if user is logged in
  const isLoggedIn = MyUser?.my_user?.userId;
  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await WatchRoomService.getWatchRooms();
        setRooms(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error("Error fetching rooms:", e);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const list = useMemo(() => {
    const now = Date.now();
    
    const mapped = rooms.map((r) => {
      const _status = deriveStatus(r.startAt);
      
      // Calculate time to expiry (ttl is epoch seconds)
      const ttlMs = r.ttl ? r.ttl * 1000 : null;
      const timeToExpiryMs = ttlMs ? ttlMs - now : null;
      const timeToExpiryMinutes = timeToExpiryMs ? Math.floor(timeToExpiryMs / 60000) : null;
      
      return {
        ...r,
        _status,
        _poster: r.posterUrl || "/fallback-poster.jpg",
        _title: r.roomName || "Phòng xem chung",
        _movieTitle: r.movieTitle || "Phim không xác định",
        _countdownText: _status === "SCHEDULED" ? fmtCountdown(r.startAt) : null,
        _hostName: r.userName || "Host",
        _avatar: r.avatarUrl || avatar_default,
        _privacy: r.isPrivate ? "Riêng tư" : "Công khai",
        _movieShort: r.movieId ? String(r.movieId).slice(0, 8) : "",
        _timeToExpiryMs: timeToExpiryMs,
        _timeToExpiryMinutes: timeToExpiryMinutes,
        _isExpiringSoon: timeToExpiryMinutes !== null && timeToExpiryMinutes < 10 && timeToExpiryMinutes >= 0,
      };
    });

    // ✅ Filter: Only show ACTIVE/SCHEDULED rooms with valid TTL
    const filtered = mapped.filter((r) => {
      // Filter out DELETED/EXPIRED status
      if (r.status === 'DELETED' || r.status === 'EXPIRED') {
        return false;
      }
      
      // Filter out rooms with expired TTL
      if (r._timeToExpiryMs !== null && r._timeToExpiryMs <= 0) {
        return false;
      }
      
      return true;
    });

    // Ưu tiên: SCHEDULED (sắp chiếu) -> ACTIVE
    filtered.sort((a, b) => {
      const rank = (s) => (s === "SCHEDULED" ? 0 : 1);
      const ra = rank(a._status);
      const rb = rank(b._status);
      if (ra !== rb) return ra - rb;
      // Nếu cùng SCHEDULED: start sớm hơn lên trước
      if (a._status === "SCHEDULED" && b._status === "SCHEDULED") {
        return (Date.parse(a.startAt || 0) || 0) - (Date.parse(b.startAt || 0) || 0);
        }
      return 0;
    });

    return filtered;
  }, [rooms]);

  /**
   * Handle room card click
   */
  const handleRoomClick = (room) => {
    // User không đăng nhập không vào được
    if (!isLoggedIn) {
      alert('⚠️ Bạn cần phải đăng nhập để sử dụng chức năng này!');
      return;
    }
    
    // Check if user is ADMIN
    const isAdmin = MyUser?.my_user?.roles?.includes('ADMIN') || 
                   MyUser?.my_user?.role === 'ADMIN' ||
                   MyUser?.roles?.includes('ADMIN');
    
    // Check if user is room owner
    const currentUserId = MyUser?.my_user?.userId ? String(MyUser.my_user.userId) : null;
    const roomOwnerId = room.userId ? String(room.userId) : null;
    const isRoomOwner = currentUserId && roomOwnerId && currentUserId === roomOwnerId;
    
    console.log('[RoomsListPage] Room click - Access check:', {
      isAdmin,
      isRoomOwner,
      currentUserId,
      roomOwnerId,
      isPrivate: room.isPrivate
    });
    
    // Admin or chủ phòng có quyền vào luôn (bypass invite code check)
    if (isAdmin || isRoomOwner) {
      // Add ?host=1 for room creator to enable host controls
      const hostParam = isRoomOwner ? '?host=1' : '';
      console.log(`[RoomsListPage] ✅ Bypassing invite check - ${isAdmin ? 'Admin' : 'Room owner'}`);
      navigate(`/watch-together/${encodeURIComponent(room.roomId)}${hostParam}`);
      return; // ✅ IMPORTANT: Stop here, don't check isPrivate
    }
    
    // Nếu phòng private, hiển thị modal nhập invite code
    if (room.isPrivate) {
      console.log('[RoomsListPage] 🔒 Private room - showing invite modal');
      setSelectedRoom(room);
      setShowInviteModal(true);
    } else {
      // Phòng public, vào trực tiếp
      console.log('[RoomsListPage] ✅ Public room - navigating directly');
      navigate(`/watch-together/${encodeURIComponent(room.roomId)}`);
    }
  };

  /**
   * Handle invite code submit
   */
  const handleInviteCodeSubmit = async (inviteCode) => {
    if (!selectedRoom) return;

    try {
      // Verify invite code với backend
      const response = await WatchRoomService.verifyInviteCode(selectedRoom.roomId, inviteCode);
    
      if (response && response.valid) {
        // Mã đúng, điều hướng với invite code trong URL
        navigate(`/watch-together/${encodeURIComponent(selectedRoom.roomId)}?invite=${encodeURIComponent(inviteCode)}`);
        setShowInviteModal(false);
        setSelectedRoom(null);
      } else {
        throw new Error('Mã mời không đúng');
      }
    } catch (error) {
      console.error('Error verifying invite code:', error);
      throw new Error(error.message || 'Mã mời không đúng. Vui lòng thử lại.');
    }
  };

  /**
   * Handle modal cancel
   */
  const handleModalCancel = () => {
    setShowInviteModal(false);
    setSelectedRoom(null);
  };

  if (loading) return <div className="container text-white py-4">Đang tải…</div>;

  return (
    <div className="rooms-list-page">
      <h2 className="section-title">Xem Chung</h2>

      {list.length === 0 ? (
        <div className="text-secondary">Chưa có phòng nào được tạo.</div>
      ) : (
        <div className="room-list">
          <div className="room-grid">
            {list.map((room) => (
              <div
                key={room.roomId}
                className="room-card"
                onClick={() => handleRoomClick(room)}
              >
                <div className="room-wrap">
                  <img
                    className="room-img"
                    src={room._poster}
                    alt={room._title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://placehold.co/400x600/1a1d29/9fb3c8?text=No+Poster";
                    }}
                  />

                  {/* Badge trạng thái */}
                  {room._status === "ACTIVE" && !room._isExpiringSoon && (
                    <span className="room-badge live-badge">
                      <span className="dot" />
                      LIVE
                    </span>
                  )}
                  {room._isExpiringSoon && (
                    <span className="room-badge expiring-badge">
                      ⏳ Sắp hết hạn ({room._timeToExpiryMinutes}p)
                    </span>
                  )}
                  {room._status === "SCHEDULED" && room._countdownText && (
                    <span className="room-badge ended-badge">
                      ⏳ {room._countdownText}
                    </span>
                  )}

                  {/* Viewer count - Real-time from backend */}
                  <div className="room-viewers">
                    <i className="fas fa-eye" /> {room.viewerCount ?? 0} <br />
                    <i className={`fas ${room.isPrivate ? 'fa-lock' : 'fa-users'}`} /> {room._privacy}
                  </div>
                </div>

                <div className="room-meta">
                  <div className="room-meta-content">
                    <img src={room._avatar} alt="host" className="room-avatar" />
                    <div className="flex-grow-1 min-w-0">
                      <h3 className="room-title">{room._title}</h3>
                      <p className="room-subtitle">
                        {room._hostName} • {room._movieTitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Code Modal */}
      <InviteCodeModal
        isOpen={showInviteModal}
        onSubmit={handleInviteCodeSubmit}
        onCancel={handleModalCancel}
        roomName={selectedRoom?._title}
      />
    </div>
  );
}
