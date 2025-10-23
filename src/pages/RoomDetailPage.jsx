import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import WatchRoomService from "../services/WatchRoomService";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const fmtHHMMSS = (sec) => {
  const s = Math.max(0, Math.floor(sec));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh} : ${mm} : ${ss}`;
};

export default function RoomDetailPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { MyUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [hideChat, setHideChat] = useState(false);
  const [reminded, setReminded] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await WatchRoomService.getWatchRoomById(roomId);
        setRoom(data);
      } catch (e) {
        toast.error("Không tìm thấy phòng.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId, navigate]);

  const hostId = room?.userId;
  const isHost = MyUser?.my_user?.userId && hostId === MyUser.my_user.userId;

  const startMs = useMemo(() => (room?.startAt ? Date.parse(room.startAt) : null), [room?.startAt]);
  const secondsLeft = useMemo(() => (startMs ? (startMs - now) / 1000 : 0), [startMs, now]);
  const isScheduled = !!startMs && secondsLeft > 0;
  const canStartNow = isHost && (!room?.isAutoStart || (room?.isAutoStart && isScheduled));

  const handleStartNow = () => {
    if (!isHost) return;
    setRoom((r) => ({ ...r, status: "ACTIVE" }));
    toast.success("Buổi xem đã bắt đầu!");
  };

  const notifTimerRef = useRef(null);
  const handleRemind = async () => {
    if (!isScheduled) return;
    try {
      if (!("Notification" in window)) {
        toast.info("Trình duyệt không hỗ trợ thông báo.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.info("Bạn đã từ chối quyền thông báo.");
        return;
      }
      const msLeft = Math.max(0, startMs - Date.now());
      clearTimeout(notifTimerRef.current);
      notifTimerRef.current = setTimeout(() => {
        new Notification("Đến giờ xem rồi!", { body: `${room?.roomName} đã bắt đầu` });
        setReminded(false);
      }, msLeft);
      setReminded(true);
      toast.success("Đã đặt nhắc giờ bắt đầu.");
    } catch {
      toast.error("Không đặt được nhắc.");
    }
  };
  useEffect(() => () => clearTimeout(notifTimerRef.current), []);

  if (loading) return <div className="container py-5 text-white">Đang tải phòng...</div>;
  if (!room) return null;

  return (
    <div className="room-wrap" style={{ backgroundColor: "#0b0c10", minHeight: "100vh" }}>
      {/* Header */}
      <div className="room-header" style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 12 }}>
        <button className="btn btn-dark" onClick={() => navigate(-1)}>‹</button>
        <div style={{ color: "#fff", fontWeight: 700 }}>{room.roomName}</div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {canStartNow && (
            <button className="btn btn-light" onClick={handleStartNow}>▶ Bắt đầu</button>
          )}
          {MyUser?.my_user?.userId && (
            <button 
              className="btn btn-success" 
              onClick={() => {
                const userId = MyUser.my_user.userId;
                const name = MyUser.my_user.fullname || MyUser.my_user.username || 'User';
                const hostParam = isHost ? '&host=1' : '';
                navigate(`/watch-together/${roomId}?userId=${userId}&name=${encodeURIComponent(name)}${hostParam}`);
              }}
              title="Xem video đồng bộ với các thành viên khác"
            >
              🎬 Xem cùng nhau
            </button>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="room-main" style={{ display: "grid", gridTemplateColumns: hideChat ? "1fr" : "1fr 360px", gap: 16, padding: 16 }}>
        {/* Poster + overlay */}
        <div className="room-stage" style={{ position: "relative", borderRadius: 16, overflow: "hidden" }}>
          <img
            src={room.posterUrl}
            alt="poster"
            style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", filter: "brightness(0.6)" }}
          />

          <div
            style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center", pointerEvents: "none",
            }}
          >
            <div
              style={{
                background: "rgba(20,20,25,0.85)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 24, padding: "28px 32px", width: 560, maxWidth: "92%",
                color: "#fff", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,.35)",
                pointerEvents: "auto",
              }}
            >
              {!isScheduled ? (
                <>
                  <div className="mb-2" style={{ opacity: .9 }}>Buổi xem chung</div>
                  <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>
                    {room.roomName} đang trực tiếp
                  </div>
                  <div style={{ fontSize: 14, opacity: .8, marginBottom: 8 }}>
                    {room.isAutoStart ? "Tự động" : "Host"} đã bắt đầu • {dayjs(room.createdAt).fromNow()}
                  </div>
                  {!isHost && (
                    <div style={{ fontSize: 12, opacity: .7 }}>Chờ host chia sẻ liên kết/phát video đồng bộ (demo)</div>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-2" style={{ opacity: .9 }}>Buổi xem chung</div>
                  <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 12 }}>
                    {room.roomName} sẽ được lên sóng sau:
                  </div>
                  <div className="wp-count-pill" style={{ display: "inline-flex", marginBottom: 12 }}>
                    ⏱ {fmtHHMMSS(secondsLeft)}
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button className="wp-btn" onClick={handleRemind} disabled={reminded}>🔔 {reminded ? "Đã đặt nhắc" : "Nhắc tôi"}</button>
                    {canStartNow && <button className="wp-btn gold" onClick={handleStartNow}>▶ Bắt đầu luôn</button>}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer info */}
          <div
            style={{
              position: "absolute", left: 0, right: 0, bottom: 0,
              display: "flex", alignItems: "center", gap: 16, padding: 16,
              color: "#fff", background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.7) 90%)",
            }}
          >
            <img src={room.posterUrl} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "50%", border: "1px solid rgba(255,255,255,.2)" }} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700 }}>{room.roomName}</div>
              <div style={{ opacity: .8, fontSize: 13 }}>
                Tạo {dayjs(room.createdAt).fromNow()} • {room.isPrivate ? "Xem riêng" : "Công khai"}
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 14 }}>
              <span title="lượt xem 👁">👁 1</span>
              <button className="wp-btn">Chia sẻ</button>
              <span>{room.isPrivate ? "🔒 Xem riêng" : "🔓 Công khai"}</span>
            </div>
          </div>
        </div>

        {/* Sidebar / chat */}
        <aside
          style={{
            background: "#0f1016", border: "1px solid #1f2233",
            borderRadius: 16, overflow: "hidden", minHeight: 520,
            display: hideChat ? "none" : "block",
          }}
        >
          <div
            style={{
              padding: "12px 14px", color: "#fff", borderBottom: "1px solid #1f2233",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700 }}>Tuỳ chỉnh</span>
            </div>
            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" id="hideChat" onChange={(e) => setHideChat(e.target.checked)} />
              <label className="form-check-label" htmlFor="hideChat" style={{ color: "#9aa0b4" }}>Ẩn chat</label>
            </div>
          </div>

          <div style={{ padding: 12, display: "flex", flexDirection: "column", height: "calc(100% - 160px)" }}>
            <div style={{ flex: 1, overflow: "auto", padding: "8px 4px", color: "#cbd1e8" }}>
              {/* messages… */}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="form-control" placeholder="Chat gì đó" maxLength={200}
                     style={{ background: "#151724", color: "#fff", border: "1px solid #272a3d" }} />
              <button className="wp-btn gold">Gửi</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
