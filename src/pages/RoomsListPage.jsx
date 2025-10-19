import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/RoomsListPage.css";
import avatar_default from "../image/default_avatar.jpg";

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
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // tick mỗi giây để cập nhật countdown
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await (await import("../services/WatchRoomService")).default.getWatchRooms();
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
    const mapped = rooms.map((r) => {
      const _status = deriveStatus(r.startAt);
      return {
        ...r,
        _status,
        _poster: r.posterUrl || "/fallback-poster.jpg",
        _title: r.roomName || "Phòng xem chung",
        _countdownText: _status === "SCHEDULED" ? fmtCountdown(r.startAt) : null,
        _viewers: _status === "ACTIVE" ? Math.ceil(Math.random() * 3) : 0, // demo
        _hostName: r.userName || "Host",
        _avatar: r.avatarUrl || avatar_default,
        _privacy: r.isPrivate ? "Riêng tư" : "Công khai",
        _movieShort: r.movieId ? String(r.movieId).slice(0, 8) : "",
      };
    });

    // Ưu tiên: SCHEDULED (sắp chiếu) -> ACTIVE
    mapped.sort((a, b) => {
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

    return mapped;
  }, [rooms]);

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
                onClick={() => navigate(`/room/${encodeURIComponent(room.roomId)}`)}
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
                  {room._status === "ACTIVE" && (
                    <span className="room-badge live-badge">
                      <span className="dot" />
                      LIVE
                    </span>
                  )}
                  {room._status === "SCHEDULED" && room._countdownText && (
                    <span className="room-badge ended-badge">
                      ⏳ {room._countdownText}
                    </span>
                  )}

                  {/* Lượt xem (demo) */}
                  <div className="room-viewers">
                    <i className="fas fa-eye" /> {room._viewers} đang xem
                  </div>
                </div>

                <div className="room-meta">
                  <div className="d-flex align-items-start gap-2">
                    <img src={room._avatar} alt="host" className="room-avatar" />
                    <div className="flex-grow-1 min-w-0">
                      <h3 className="room-title">{room._title}</h3>
                      <p className="room-subtitle">
                        {room._hostName} • {room._privacy}
                        {room._movieShort ? ` • #${room._movieShort}` : ""}
                      </p>
                      {/* Không còn createdAt để “fromNow” nên bỏ dòng time */}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
