import React, { useEffect, useMemo, useState } from "react";
import EpisodeService from "../services/EpisodeService";
import SeasonService from "../services/SeasonService";
import MovieService from "../services/MovieService";
import SubtitleManager from "../components/SubtitleManager";
import "../css/ModelAddNewEpisode.css";
import { toast } from "react-toastify";


// ==== Validators (khớp BE) ====
const RE_TITLE = /^[\p{L}\p{N}\s\-:,.!?]{1,200}$/u; // cho phép chữ có dấu, số, khoảng trắng & - : , . ! ?


const prettyError = (msg) =>
  toast.error(`❌ ${msg}`, { autoClose: 2500, theme: "colored" });


const VIDEO_TYPES = [
  "video/mp4","video/avi","video/mkv","video/webm",
  "video/quicktime","video/x-msvideo","video/x-matroska"
];

export default function ModelAddNewEpisode({ movieId, onClose, onSuccess }) {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [episodes, setEpisodes] = useState([]);
  const [movieType, setMovieType] = useState(null);

  // create | edit
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState({
    title: "",
    episodeNumber: "",
    video: null
  });

  // Subtitle management
  const [selectedEpisodeForSubtitles, setSelectedEpisodeForSubtitles] = useState(null);

  // tạo season mới
  const [showNewSeason, setShowNewSeason] = useState(false);
  const [newSeason, setNewSeason] = useState({ seasonNumber: 1, title: "", releaseYear: "" });

  const [loading, setLoading] = useState(false);

  const isValidVideo = (f) => f && VIDEO_TYPES.includes(f.type);
  const maxSeasonNumber = useMemo(
    () => (seasons.length ? Math.max(...seasons.map(s => Number(s.seasonNumber) || 0)) : 0),
    [seasons]
  );

  const nextEpNo = (eps) => {
    if (!eps?.length) return 1;
    const maxNo = Math.max(...eps.map(e => Number(e.episodeNumber) || 0));
    return (isFinite(maxNo) ? maxNo : 0) + 1;
  };

  useEffect(() => {
    (async () => {
      try {
        // first fetch movie detail to know movieType (SINGLE vs SERIES)
        try {
          const mvData = await MovieService.getMovieDetail(movieId);
          const mv = mvData?.movie || mvData || {};
          setMovieType(mv?.movieType || mv?.movie_type || mv?.type || null);
        } catch (err) {
          // ignore movie fetch error, proceed to load seasons
          setMovieType(null);
        }

        const list = await SeasonService.getSeasonsByMovie(movieId);
        const arr = Array.isArray(list) ? list.sort((a,b)=>a.seasonNumber-b.seasonNumber) : [];
        setSeasons(arr);
        if (arr.length) {
          const sid = arr[arr.length - 1].seasonId; // chọn season mới nhất
          setSeasonId(sid);
          await loadEpisodes(sid, true);
        } else {
          // only allow auto-showing new season form for non-SINGLE movies
          if (movieType !== 'SINGLE') {
            setShowNewSeason(true);
            setNewSeason({ seasonNumber: 1, title: "Phần 1", releaseYear: "" });
          } else {
            // SINGLE movies should not have seasons
            setShowNewSeason(false);
            setSeasonId("");
          }
        }
      } catch (e) {
        console.error(e);
        toast.error("Không tải được season");
      }
    })();
  }, [movieId]);

  const loadEpisodes = async (sid, resetToCreate = false) => {
    try {
      const eps = await EpisodeService.getEpisodesBySeasonId(sid);
      const list = Array.isArray(eps) ? eps : [];
      setEpisodes(list);
      if (resetToCreate) {
        setMode("create");
        setForm({ title: "", episodeNumber: String(nextEpNo(list)), video: null });
      }
    } catch {
      setEpisodes([]);
      if (resetToCreate) setForm({ title: "", episodeNumber: "1", video: null });
    }
  };

  const handlePickSeason = async (sid) => {
    setSeasonId(sid);
    await loadEpisodes(sid, true);
  };

  const handleSelectEpisode = async (ep) => {
    try {
      const data = await EpisodeService.getEpisodeBySeasonAndNumber(ep.seasonId || seasonId, ep.episodeNumber);
      setMode("edit");
      setForm({
        title: data?.title || "",
        episodeNumber: String(data?.episodeNumber || ""),
        video: null
      });
    } catch {
      toast.error("Không lấy được thông tin tập");
    }
  };

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === "file") {
      const f = files?.[0];
      if (!f) return;
      if (!isValidVideo(f)) return toast("Chỉ chấp nhận mp4, avi, mkv, webm, mov…");
      setForm(s => ({ ...s, video: f }));
    } else {
      setForm(s => ({ ...s, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seasonId) return toast.error("Vui lòng chọn season");
    const title = (form.title || "").trim();
    if (!title) return toast.error("Nhập tiêu đề tập");
    if (!RE_TITLE.test(title)) return toast.error("Tiêu đề tập không hợp lệ");
    if (mode === "create" && !form.video) return toast.error("Chọn file video để upload");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("seasonId", seasonId);
      fd.append("movieId", movieId);
      fd.append("title", form.title.trim());
      fd.append("episodeNumber", Number(form.episodeNumber));
      if (form.video) fd.append("video", form.video);

      if (mode === "create") {
        await EpisodeService.addEpisode(fd);
        toast.success("Thêm tập mới thành công");
      } else {
        await EpisodeService.updateEpisode(seasonId, Number(form.episodeNumber), fd);
        toast.success("Cập nhật tập thành công");
      }
      await loadEpisodes(seasonId, true);
      onSuccess?.();
    } catch (err) {
      toast.error("Lỗi lưu tập: " + (err?.message || ""));
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (mode !== "edit") return;
    const epNo = Number(form.episodeNumber);
    if (!window.confirm(`Xoá tập ${epNo}?`)) return;
    setLoading(true);
    try {
      await EpisodeService.deleteEpisode(seasonId, epNo);
      toast.success("Đã xoá tập");
      await loadEpisodes(seasonId, true);
      onSuccess?.();
    } catch (err) {
      toast.error("Xoá thất bại: " + (err?.message || ""));
    } finally { setLoading(false); }
  };

  const toggleNewSeason = () => {
    setShowNewSeason(v => !v);
    if (!showNewSeason) {
      setNewSeason({
        seasonNumber: maxSeasonNumber + 1,
        title: `Phần ${maxSeasonNumber + 1}`,
        releaseYear: ""
      });
    }
  };

  const handleCreateSeason = async (e) => {
    e.preventDefault();
    if (movieType === 'SINGLE') {
      return toast.error('Không thể tạo Season cho phim loại SINGLE');
    }
    if (!newSeason.seasonNumber || Number(newSeason.seasonNumber) < 1) {
      return toast.error("seasonNumber phải >= 1");
    }
    try {
      const s = await SeasonService.createSeason({
        movieId,
        seasonNumber: Number(newSeason.seasonNumber),
        title: newSeason.title?.trim() || `Phần ${newSeason.seasonNumber}`,
        description: "",
        releaseYear: newSeason.releaseYear ? Number(newSeason.releaseYear) : undefined,
        posterUrl: ""
      });
      toast.success("Đã tạo season mới");
      setShowNewSeason(false);
      const list = await SeasonService.getSeasonsByMovie(movieId);
      const arr = Array.isArray(list) ? list.sort((a,b)=>a.seasonNumber-b.seasonNumber) : [];
      setSeasons(arr);
      setSeasonId(s.seasonId);
      await loadEpisodes(s.seasonId, true);
    } catch (err) {
      toast.error("Tạo season thất bại: " + (err?.message || ""));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="model-add-movie">
        <h4 className="mb-3">Quản lý tập phim</h4>

        {/* Season + Tạo season mới */}
        <div className="card border-0 shadow-sm mb-3 season-management-card">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-6">
                <label className="form-label">Season</label>
                <select className="form-select" value={seasonId} onChange={(e) => handlePickSeason(e.target.value)}>
                  {seasons.map(s => (
                    <option key={s.seasonId} value={s.seasonId}>Season {s.seasonNumber}</option>
                  ))}
                </select>
                {seasons.length === 0 && <div className="text-muted small mt-1">Phim chưa có season — hãy tạo Season 1 trước.</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">&nbsp;</label><br/>
                <button
                  type="button"
                  className="btn btn-create-season"
                  onClick={() => {
                    if (movieType === 'SINGLE') {
                      toast.info('Không thể tạo Season cho phim loại SINGLE');
                      return;
                    }
                    toggleNewSeason();
                  }}
                  disabled={movieType === 'SINGLE'}
                >
                  {showNewSeason ? "Đóng tạo Season" : "Tạo Season mới"}
                </button>
                {movieType === 'SINGLE' && (
                  <div className="text-muted small mt-1">Phim loại SINGLE không hỗ trợ Season.</div>
                )}
              </div>
            </div>

            {showNewSeason && (
              <form onSubmit={handleCreateSeason} className="row g-3 mt-2 new-season-form">
                <div className="col-md-3">
                  <label className="form-label">Season Number</label>
                  <input type="number" min={1} className="form-control"
                         value={newSeason.seasonNumber}
                         onChange={(e)=>setNewSeason(s=>({...s,seasonNumber:e.target.value}))}/>
                </div>
                <div className="col-md-5">
                  <label className="form-label">Tiêu đề</label>
                  <input className="form-control"
                         value={newSeason.title}
                         onChange={(e)=>setNewSeason(s=>({...s,title:e.target.value}))}/>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Năm</label>
                  <input type="number" className="form-control"
                         value={newSeason.releaseYear}
                         onChange={(e)=>setNewSeason(s=>({...s,releaseYear:e.target.value}))}/>
                </div>
                <div className="col-md-2 d-grid">
                  <label className="form-label invisible">.</label>
                  <button className="btn btn-primary" type="submit">Tạo</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Danh sách tập */}
        <div className="card border-0 shadow-sm mb-3 episodes-list-card">
          <div className="card-body">
            <div className="d-flex flex-wrap gap-2">
              {episodes.map(ep => {
                const active = mode === "edit" && Number(form.episodeNumber) === Number(ep.episodeNumber);
                return (
                  <button
                    key={ep.episodeNumber}
                    type="button"
                    className={`btn btn-sm episode-btn ${active ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={()=>handleSelectEpisode(ep)}
                    title={ep.title}
                  >
                    <span>Tập {ep.episodeNumber}</span>
                  </button>
                );
              })}
              {!episodes.length && <span className="text-muted">Chưa có tập nào.</span>}
            </div>
          </div>
        </div>

        {/* Form tạo/sửa tập */}
        <div className="episode-form">
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="mb-2">
              <span className="mode-badge">{mode === "edit" ? "Chế độ: Sửa tập" : "Chế độ: Thêm tập mới"}</span>
            </div>

            <div className="mb-3">
              <label className="form-label">Số tập</label>
              <input type="number" min={1} className="form-control" name="episodeNumber"
                     value={form.episodeNumber} onChange={handleChange}
                     disabled={mode !== "edit"} />
              <div className="form-text">Số tập được tự động tăng khi thêm tập mới; trường này bị vô hiệu hóa khi thêm mới.</div>
            </div>

            <div className="mb-3">
              <label className="form-label">Tiêu đề tập</label>
              <input className="form-control" name="title" value={form.title} onChange={handleChange}/>
            </div>

            <div className="mb-3">
              <label className="form-label">{mode === "edit" ? "Thay video (tuỳ chọn)" : "Video (bắt buộc)"}</label>
              <input type="file" className="form-control" accept="video/*" onChange={handleChange}/>
              {mode === "edit" && <div className="form-text">Để trống nếu chỉ muốn đổi tên tập.</div>}
            </div>

            <div className="action-buttons">
              <button className="btn btn-primary-custom" type="submit" disabled={loading || !seasonId}>
                {loading ? "Đang lưu..." : (mode === "edit" ? "Lưu thay đổi" : "Thêm tập")}
              </button>
              {mode === "edit" && (
                <button type="button" className="btn btn-danger-custom" onClick={handleDelete} disabled={loading}>
                  Xoá tập
                </button>
              )}
              <button className="btn btn-secondary-custom" type="button" onClick={onClose}>Đóng</button>
            </div>
          </form>
          
          {/* Subtitle Management - chỉ hiện khi đã chọn episode để edit hoặc vừa tạo xong */}
          {mode === "edit" && seasonId && form.episodeNumber && (
            <div className="mt-4">
              <hr />
              <SubtitleManager 
                seasonId={seasonId}
                episodeNumber={parseInt(form.episodeNumber)}
                onSubtitlesChange={(subtitles) => {
                  console.log('Subtitles updated:', subtitles);
                }}
                className="subtitle-section"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
