import React, { useEffect, useState } from "react";
import EpisodeService from "../services/EpisodeService";
import SeasonService from "../services/SeasonService"; // GET /seasons/movie/{movieId}
import "../css/ModelAddMovie.css";
import { toast } from "react-toastify";

const VIDEO_TYPES = [
  "video/mp4","video/avi","video/mkv","video/webm",
  "video/quicktime","video/x-msvideo","video/x-matroska"
];

export default function ModelAddNewEpisode({ movieId, onClose, onSuccess }) {
  const [seasons, setSeasons] = useState([]);
  const [seasonId, setSeasonId] = useState("");
  const [form, setForm] = useState({
    title: "",
    episodeNumber: "",
    inputMode: "file", // 'file' | 'link'
    video: null,
    videoLink: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await SeasonService.getSeasonsByMovie(movieId); // /seasons/movie/{movieId}
        const arr = Array.isArray(list) ? list : [];
        setSeasons(arr);
        if (arr.length) {
          setSeasonId(arr[0].seasonId);
          // gợi ý số tập kế tiếp
          try {
            const { count } = await EpisodeService.countBySeason(arr[0].seasonId); // /episodes/season/{id}/count
            setForm(f => ({ ...f, episodeNumber: String((count || 0) + 1) }));
          } catch (_) {}
        }
      } catch (e) {
        toast.error("Không tải được danh sách season");
      }
    })();
  }, [movieId]);

  const isValidVideoFile = (file) => file && VIDEO_TYPES.includes(file.type);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (name === "inputMode") {
      setForm(f => ({ ...f, inputMode: value, video: null, videoLink: "" }));
      return;
    }
    if (type === "file") {
      const file = files?.[0];
      if (!file) return;
      if (!isValidVideoFile(file)) {
        toast("Chỉ chấp nhận mp4, avi, mkv, webm, mov…");
        return;
      }
      setForm(f => ({ ...f, video: file }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handlePickSeason = async (sid) => {
    setSeasonId(sid);
    try {
      const { count } = await EpisodeService.countBySeason(sid);
      setForm(f => ({ ...f, episodeNumber: String((count || 0) + 1) }));
    } catch (_) {
      setForm(f => ({ ...f, episodeNumber: "1" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seasonId) return toast.error("Vui lòng chọn season");
    if (!form.title) return toast.error("Nhập tiêu đề tập");
    if (!form.episodeNumber) return toast.error("Nhập số tập");

    if (form.inputMode === "file" && !form.video) {
      return toast.error("Chọn file video để upload");
    }
    if (form.inputMode === "link" && !form.videoLink.trim()) {
      return toast.error("Nhập link HLS (.m3u8)");
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("seasonId", seasonId);
      fd.append("movieId", movieId);
      fd.append("title", form.title);
      fd.append("episodeNumber", Number(form.episodeNumber));
      if (form.inputMode === "file") fd.append("video", form.video);
      if (form.inputMode === "link") fd.append("videoLink", form.videoLink.trim());

      await EpisodeService.uploadEpisode(fd); // POST /episodes/upload (multipart/form-data)
      toast.success("Thêm tập mới thành công");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error("Lỗi thêm tập: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="model-add-movie">
        <h4>Thêm tập mới</h4>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-3">
            <label className="form-label">Season</label>
            <select
              className="form-select"
              value={seasonId}
              onChange={(e) => handlePickSeason(e.target.value)}
            >
              {seasons.map(s => (
                <option key={s.seasonId} value={s.seasonId}>
                  Season {s.seasonNumber}{s.episodesCount ? ` (${s.episodesCount})` : ""}
                </option>
              ))}
            </select>
            {seasons.length === 0 && <div className="text-muted small mt-1">Phim chưa có season — hãy tạo Season 1 trước.</div>}
          </div>

          <div className="mb-3">
            <label className="form-label">Tiêu đề tập</label>
            <input className="form-control" name="title" value={form.title} onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label className="form-label">Số tập</label>
            <input
              type="number"
              min={1}
              className="form-control"
              name="episodeNumber"
              value={form.episodeNumber}
              onChange={handleChange}
            />
          </div>

          <div className="mb-2">
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" id="modeFile" name="inputMode"
                     value="file" checked={form.inputMode === "file"} onChange={handleChange}/>
              <label className="form-check-label" htmlFor="modeFile">Upload file</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="radio" id="modeLink" name="inputMode"
                     value="link" checked={form.inputMode === "link"} onChange={handleChange}/>
              <label className="form-check-label" htmlFor="modeLink">Dán link HLS (.m3u8)</label>
            </div>
          </div>

          {form.inputMode === "file" ? (
            <div className="mb-3">
              <input type="file" className="form-control" accept="video/*" onChange={handleChange} />
            </div>
          ) : (
            <div className="mb-3">
              <input
                className="form-control"
                placeholder="https://.../output.m3u8"
                name="videoLink"
                value={form.videoLink}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-primary" type="submit" disabled={loading || !seasons.length}>
              {loading ? "Đang thêm..." : "Thêm tập"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onClose}>Đóng</button>
          </div>
        </form>
      </div>
    </div>
  );
}
