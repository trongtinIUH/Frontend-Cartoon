import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import WatchRoomService from "../services/WatchRoomService";

const fmtDateTimeLocal = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${mi}`;
};

const fmtLocalDate = (d = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const genRoomId = () =>
  "room_" + Math.random().toString(36).slice(2, 10);

export default function CreateMovieRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { MyUser } = useAuth();

  const movie = location.state?.movie;

  useEffect(() => {
    if (!movie) navigate(-1);
  }, [movie, navigate]);

  useEffect(() => {
    if (!MyUser?.my_user) navigate("/");
  }, [MyUser, navigate]);

  const posters = useMemo(() => {
    const arr = Array.isArray(movie?.posters) ? movie.posters : [];
    return arr.length ? arr : [movie?.poster || movie?.thumbnailUrl || "/fallback-poster.jpg"];
  }, [movie]);

  const [roomName, setRoomName] = useState(`Cùng xem ${movie?.title || "phim này"} nhé`);
  const [selectedPoster, setSelectedPoster] = useState(posters[0]);
  const [autoStart, setAutoStart] = useState(false);
  const [startAt, setStartAt] = useState(() => {
    const t = new Date();
    t.setMinutes(t.getMinutes() + 5);
    return fmtDateTimeLocal(t);
  });

  useEffect(() => {
    setSelectedPoster((prev) => (posters.includes(prev) ? prev : posters[0]));
  }, [posters]);

  useEffect(() => {
    const defaultPrefix = "Cùng xem ";
    if (roomName?.startsWith(defaultPrefix)) {
      setRoomName(`Cùng xem ${movie?.title || "phim này"} nhé`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie?.title]);

  const minStartLocal = useMemo(() => {
    const t = new Date();
    t.setMinutes(t.getMinutes() + 2);
    return fmtDateTimeLocal(t);
  }, []);

  const isStartAtValid = useMemo(() => {
    if (!autoStart) return true;
    const picked = new Date(startAt).getTime();
    const min = new Date(minStartLocal).getTime();
    return !Number.isNaN(picked) && picked >= min;
  }, [autoStart, startAt, minStartLocal]);

  const disabledCreate =
    !roomName?.trim() || !selectedPoster || !MyUser?.my_user || !isStartAtValid;

  const handleCreate = async () => {
    try {
      if (disabledCreate) {
        if (!isStartAtValid) {
          toast.error("Thời gian bắt đầu phải lớn hơn hiện tại ít nhất 2 phút.");
        }
        return;
      }

      const roomId = genRoomId();
      const payload = {
        roomId,
        userId: MyUser.my_user.userId,
        movieId: movie?.movieId || movie?.id,
        roomName: roomName.trim(),
        posterUrl: selectedPoster,
        isPrivate: false,
        isAutoStart: autoStart,
        startAt: autoStart ? new Date(startAt).toISOString() : null,
        createdAt: fmtLocalDate(new Date()),
        status: autoStart ? "SCHEDULED" : "ACTIVE",
      };

      await WatchRoomService.createWatchRoom(payload);

      toast.success("Tạo phòng thành công!");
      navigate(`/room/${roomId}`, { replace: true });
    } catch (e) {
      console.error(e);
      toast.error("Không tạo được phòng. Thử lại nhé!");
    }
  };

  return (
    <div className="container-fluid bg-dark text-white min-vh-100 py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8 mb-4 d-flex bg-dark align-items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-circle"
            title="Quay lại"
            aria-label="Quay lại"
          >
            <i className="fa-solid fa-arrow-left" />
          </button>
          <h2 className="mb-4 mt-4">Tạo phòng xem chung</h2>
        </div>

        <div className="row">
          <div className="col-12 col-lg-5 mb-4">
            <div className="rounded-4 overflow-hidden" style={{ background: "#12131a", border: "1px solid #232534", padding: 16 }}>
              <div className="rounded-3 overflow-hidden mb-3" style={{ width: "100%", aspectRatio: "3/4", background: "#1a1c26" }}>
                <img src={selectedPoster} alt="poster" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <h4 className="mb-1">{movie?.title}</h4>
                {movie?.tagLine && <div className="text-white small mb-1">{movie.tagLine}</div>}
                {movie?.category && <div className="small" style={{ color: "#c3c7ff" }}>{movie.category}</div>}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="rounded-4 p-4 mb-3" style={{ background: "#12131a", border: "1px solid #232534" }}>
              <div className="mb-2 fw-semibold">1. Tên phòng</div>
              <input
                className="form-control bg-secondary text-white border-0"
                style={{ background: "#1a1c26", color: "#e6e6e6", border: "1px solid #2b2e3f" }}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder={`Cùng xem ${movie?.title || "phim này"} nhé`}
              />
            </div>

            <div className="rounded-4 p-4 mb-3" style={{ background: "#12131a", border: "1px solid #232534" }}>
              <div className="mb-3 fw-semibold">2. Chọn poster hiển thị</div>
              <div className="d-flex flex-wrap gap-3">
                {posters.map((p) => {
                  const active = p === selectedPoster;
                  return (
                    <button
                      key={p}
                      onClick={() => setSelectedPoster(p)}
                      className="p-1 rounded-3"
                      style={{ border: active ? "2px solid #e8b84a" : "2px solid #2b2e3f", background: active ? "#1e1b13" : "#171923" }}
                      title="Chọn poster"
                      type="button"
                    >
                      <img
                        src={p}
                        alt="poster option"
                        style={{ width: 92, height: 140, objectFit: "cover", borderRadius: 10, opacity: active ? 1 : 0.8 }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-4 p-4 mb-4" style={{ background: "#12131a", border: "1px solid #232534" }}>
              <div className="mb-2 fw-semibold">3. Cài đặt thời gian</div>
              <div className="text-muted mb-3">Có thể bắt đầu thủ công hoặc tự động theo thời gian cài đặt.</div>

              <div className="form-check form-switch mb-3">
                <input className="form-check-input" type="checkbox" id="autoStartSwitch" checked={autoStart} onChange={(e) => setAutoStart(e.target.checked)} />
                <label className="form-check-label" htmlFor="autoStartSwitch">Tôi muốn bắt đầu tự động</label>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Thời gian bắt đầu</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    style={{ background: "#1a1c26", color: "#e6e6e6", border: "1px solid #2b2e3f" }}
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    min={minStartLocal}
                    disabled={!autoStart}
                  />
                  {autoStart && !isStartAtValid && (
                    <div className="form-text text-danger mt-1">Chọn thời gian không hợp lệ. Hãy chọn ≥ hiện tại 2 phút.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="d-flex gap-3">
              <button className="btn btn-warning fw-semibold" disabled={disabledCreate} onClick={handleCreate}>
                Tạo phòng
              </button>
              <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
